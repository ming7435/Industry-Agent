import sys
import unittest
from datetime import datetime, timedelta
from pathlib import Path
from threading import Event, Lock
from time import monotonic, sleep


SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.monitor import (
    AbnormalEvent,
    AlertLevel,
    DeviceMonitor,
    DeviceSample,
    FactorySnapshotProvider,
    MonitorConfig,
    MonitorRunner,
    MonitorStatus,
    RuleType,
)


class DeviceMonitorTests(unittest.TestCase):
    def setUp(self):
        self.start = datetime(2026, 9, 14, 10, 0, 0)

    def sample(
        self,
        seconds,
        temperature=50.0,
        vibration=1.0,
        alarm_code=None,
        alarm_level=None,
    ):
        return DeviceSample(
            device_id="CNC-001",
            timestamp=self.start + timedelta(seconds=seconds),
            temperature=temperature,
            vibration=vibration,
            rpm=6000.0,
            alarm_code=alarm_code,
            alarm_level=alarm_level,
        )

    def test_monitor_runs_continuously_but_does_not_trigger_on_first_sample(self):
        monitor = DeviceMonitor()

        first = monitor.observe(self.sample(0, temperature=61.0))

        self.assertEqual(first.status, MonitorStatus.WARNING)
        self.assertFalse(first.agent_should_run)

    def test_continuous_metric_does_not_use_occurrence_count(self):
        monitor = DeviceMonitor()

        results = [
            monitor.observe(self.sample(i, temperature=61.0)) for i in range(3)
        ]

        self.assertFalse(results[0].agent_should_run)
        self.assertFalse(results[1].agent_should_run)
        self.assertFalse(results[2].agent_should_run)

        persistent = monitor.observe(self.sample(3, temperature=82.0))
        self.assertFalse(persistent.agent_should_run)

    def test_five_seconds_trigger_when_occurrence_threshold_is_not_reached(self):
        monitor = DeviceMonitor(
            MonitorConfig(abnormal_occurrence_threshold=99)
        )

        for second in range(6):
            result = monitor.observe(self.sample(second, vibration=7.5))

        self.assertTrue(result.agent_should_run)
        self.assertIn("阈值规则：vibration 超过阈值 4.5mm/s", result.trigger.trigger_reasons)
        self.assertIn("持续规则：vibration 持续异常达到 5.0 秒", result.trigger.trigger_reasons)
        self.assertEqual(result.trigger.abnormal_events[0].rule_type, RuleType.DURATION)

    def test_normal_sample_breaks_continuous_duration_but_not_occurrence_count(self):
        monitor = DeviceMonitor(
            MonitorConfig(abnormal_occurrence_threshold=3)
        )

        monitor.observe(self.sample(0, temperature=61.0))
        monitor.observe(self.sample(1))
        second = monitor.observe(self.sample(2, temperature=61.0))
        self.assertFalse(second.agent_should_run)

        results = [
            monitor.observe(self.sample(second, temperature=61.0))
            for second in range(4, 9)
        ]
        triggered = next(item for item in results if item.agent_should_run)
        self.assertIn(
            "持续规则：temperature 持续异常达到 5.0 秒",
            triggered.trigger.trigger_reasons,
        )

    def test_multiple_anomalies_are_sent_together(self):
        monitor = DeviceMonitor()

        result = monitor.observe(
            self.sample(
                0,
                temperature=85.0,
                vibration=8.0,
                alarm_code="E102",
                alarm_level=AlertLevel.HIGH,
            )
        )

        self.assertTrue(result.agent_should_run)
        keys = {item.key for item in result.trigger.abnormal_events}
        self.assertEqual(
            keys,
            {"temperature", "vibration", "alarm:E102", "multi_metric:temperature+vibration"},
        )
        self.assertIn("关键规则：设备报警，严重报警立即触发", result.trigger.trigger_reasons)
        self.assertIn("多指标规则：同时存在 2 个异常指标", result.trigger.trigger_reasons)
        self.assertIsInstance(result.trigger.abnormal_events[0], AbnormalEvent)

    def test_recovery_allows_a_new_trigger(self):
        monitor = DeviceMonitor()

        for second in range(6):
            first_trigger = monitor.observe(self.sample(second, temperature=61.0))
        self.assertTrue(first_trigger.agent_should_run)

        recovered = monitor.observe(self.sample(6))
        self.assertFalse(recovered.agent_should_run)
        self.assertEqual(recovered.status, MonitorStatus.NORMAL)

        second_trigger = None
        for second in range(8, 14):
            second_trigger = monitor.observe(self.sample(second, temperature=61.0))
        self.assertIsNotNone(second_trigger)
        self.assertTrue(second_trigger.agent_should_run)

    def test_factory_threshold_levels_match_default_profile(self):
        temperature_monitor = DeviceMonitor()
        initial = temperature_monitor.observe(self.sample(0, temperature=60.0))
        self.assertEqual(initial.observations[0].alert_level, AlertLevel.INITIAL)
        self.assertEqual(initial.status, MonitorStatus.WARNING)

        intermediate = temperature_monitor.observe(self.sample(1, temperature=70.0))
        self.assertEqual(
            intermediate.observations[0].alert_level,
            AlertLevel.INTERMEDIATE,
        )
        self.assertEqual(intermediate.status, MonitorStatus.ALARM)

        high = temperature_monitor.observe(self.sample(2, temperature=80.0))
        self.assertEqual(high.observations[0].alert_level, AlertLevel.HIGH)
        self.assertEqual(high.status, MonitorStatus.FAULT)

        vibration_monitor = DeviceMonitor()
        vibration = vibration_monitor.observe(self.sample(0, vibration=4.5))
        self.assertEqual(vibration.observations[0].alert_level, AlertLevel.HIGH)

    def test_same_fault_and_same_level_does_not_retrigger_agent(self):
        monitor = DeviceMonitor(
            MonitorConfig(abnormal_occurrence_threshold=99)
        )

        results = [
            monitor.observe(self.sample(second, temperature=61.0))
            for second in range(6)
        ]
        self.assertTrue(results[5].agent_should_run)
        first_event = results[5].trigger.abnormal_event

        for second in range(6, 12):
            result = monitor.observe(self.sample(second, temperature=61.0))
            self.assertFalse(result.agent_should_run)

        active = monitor.active_anomalies("CNC-001")
        self.assertEqual(active[0].event_id, first_event.event_id)
        self.assertEqual(active[0].event_revision, 1)

    def test_severity_upgrade_retriggers_with_same_event_id(self):
        monitor = DeviceMonitor(
            MonitorConfig(abnormal_occurrence_threshold=99)
        )

        for second in range(6):
            result = monitor.observe(self.sample(second, temperature=61.0))
        first_event = result.trigger.abnormal_event
        self.assertEqual(first_event.severity, "initial")
        self.assertEqual(first_event.event_revision, 1)

        upgraded = monitor.observe(self.sample(6, temperature=71.0))
        self.assertTrue(upgraded.agent_should_run)
        self.assertEqual(upgraded.trigger.trigger_cause, "故障等级升级")
        self.assertEqual(upgraded.trigger.abnormal_event.event_id, first_event.event_id)
        self.assertEqual(upgraded.trigger.abnormal_event.event_revision, 2)
        self.assertEqual(upgraded.trigger.abnormal_event.severity, "intermediate")

        for second in range(7, 10):
            stable = monitor.observe(self.sample(second, temperature=71.0))
            self.assertFalse(stable.agent_should_run)

    def test_severity_downgrade_only_updates_event_without_retriggering(self):
        monitor = DeviceMonitor(
            MonitorConfig(abnormal_occurrence_threshold=99)
        )

        for second in range(6):
            result = monitor.observe(self.sample(second, temperature=61.0))
        first_event = result.trigger.abnormal_event
        upgraded = monitor.observe(self.sample(6, temperature=71.0))
        self.assertTrue(upgraded.agent_should_run)

        downgraded = monitor.observe(self.sample(7, temperature=61.0))
        self.assertFalse(downgraded.agent_should_run)
        active = monitor.active_anomalies("CNC-001")
        self.assertEqual(active[0].event_id, first_event.event_id)
        self.assertEqual(active[0].alert_level, AlertLevel.INITIAL)
        self.assertEqual(active[0].event_revision, 2)

    def test_staggered_related_metrics_share_one_incident(self):
        monitor = DeviceMonitor(
            MonitorConfig(abnormal_occurrence_threshold=99)
        )

        results = []
        for second in range(10):
            results.append(
                monitor.observe(
                    self.sample(
                        second,
                        temperature=61.0,
                        vibration=1.0 if second == 0 else 1.9,
                    )
                )
            )

        triggers = [item.trigger for item in results if item.agent_should_run]
        self.assertEqual(len(triggers), 1)
        self.assertEqual(triggers[0].trigger_cause, "首次确认异常")
        event_ids = {
            item.event_id
            for item in triggers[0].abnormal_events
        }
        self.assertEqual(len(event_ids), 1)

    def test_recovery_then_recurrence_creates_a_new_event_id(self):
        monitor = DeviceMonitor(
            MonitorConfig(abnormal_occurrence_threshold=99)
        )

        for second in range(6):
            result = monitor.observe(self.sample(second, temperature=61.0))
        first_event_id = result.trigger.abnormal_event.event_id

        recovered = monitor.observe(self.sample(6, temperature=50.0))
        self.assertFalse(recovered.agent_should_run)
        self.assertEqual(monitor.active_anomalies("CNC-001"), [])

        for second in range(7, 13):
            result = monitor.observe(self.sample(second, temperature=61.0))
        self.assertTrue(result.agent_should_run)
        self.assertNotEqual(result.trigger.abnormal_event.event_id, first_event_id)
        self.assertEqual(result.trigger.trigger_cause, "首次确认异常")

    def test_critical_fault_triggers_immediately_without_duration(self):
        monitor = DeviceMonitor()
        result = monitor.observe(
            self.sample(0, alarm_code="E_STOP", alarm_level=AlertLevel.HIGH)
        )

        self.assertTrue(result.agent_should_run)
        self.assertEqual(result.trigger.trigger_cause, "首次确认异常")
        self.assertEqual(result.trigger.abnormal_event.event_revision, 1)

    def test_critical_rule_triggers_on_first_critical_alarm(self):
        monitor = DeviceMonitor()

        result = monitor.observe(
            self.sample(
                0,
                alarm_code="E_STOP",
                alarm_level=AlertLevel.HIGH,
            )
        )

        self.assertTrue(result.agent_should_run)
        self.assertIn("关键规则：设备报警，严重报警立即触发", result.trigger.trigger_reasons)
        self.assertEqual(result.trigger.abnormal_events[0].rule_type, RuleType.CRITICAL)

    def test_count_rule_uses_a_five_minute_window(self):
        monitor = DeviceMonitor()

        first = monitor.observe(
            self.sample(0, alarm_code="E102", alarm_level=AlertLevel.INITIAL)
        )
        second = monitor.observe(
            self.sample(60, alarm_code="E102", alarm_level=AlertLevel.INITIAL)
        )
        third = monitor.observe(
            self.sample(240, alarm_code="E102", alarm_level=AlertLevel.INITIAL)
        )

        self.assertFalse(first.agent_should_run)
        self.assertFalse(second.agent_should_run)
        self.assertTrue(third.agent_should_run)
        self.assertIn(
            "计数规则：设备报警 在 300 秒时间窗口内出现次数达到 3",
            third.trigger.trigger_reasons,
        )
        alarm_event = next(
            item for item in third.trigger.abnormal_events if item.key == "alarm:E102"
        )
        self.assertEqual(alarm_event.rule_type, RuleType.COUNT)
        self.assertEqual(alarm_event.occurrence_count, 3)

    def test_trend_rule_triggers_on_worsening_temperature(self):
        monitor = DeviceMonitor()

        monitor.observe(self.sample(0, temperature=60.0))
        monitor.observe(self.sample(1, temperature=61.0))
        result = monitor.observe(self.sample(2, temperature=62.0))

        self.assertTrue(result.agent_should_run)
        self.assertIn("趋势规则：temperature 连续 3 个采样持续恶化", result.trigger.trigger_reasons)
        trend_event = next(
            item for item in result.trigger.abnormal_events if item.key == "trend:temperature"
        )
        self.assertEqual(trend_event.rule_type, RuleType.TREND)

    def test_multi_metric_rule_escalates_and_triggers(self):
        monitor = DeviceMonitor()

        result = monitor.observe(self.sample(0, temperature=60.0, vibration=1.8))

        self.assertTrue(result.agent_should_run)
        self.assertEqual(result.status, MonitorStatus.ALARM)
        self.assertIn("多指标规则：同时存在 2 个异常指标", result.trigger.trigger_reasons)
        combined = next(
            item
            for item in result.trigger.abnormal_events
            if item.rule_type == RuleType.MULTI_METRIC
        )
        self.assertEqual(combined.alert_level, AlertLevel.INTERMEDIATE)

    def test_trigger_payload_contains_unified_abnormal_events(self):
        monitor = DeviceMonitor()

        result = monitor.observe(
            self.sample(0, alarm_code="E_STOP", alarm_level=AlertLevel.HIGH)
        )

        payload = result.to_dict()
        self.assertTrue(payload["agent_should_run"])
        self.assertIn("abnormal_events", payload["trigger"])
        self.assertIn("rule_types", payload["trigger"])
        event = payload["trigger"]["abnormal_event"]
        self.assertEqual(event["device_id"], "CNC-001")
        self.assertIn("event_type", event)
        self.assertIn("severity", event)
        self.assertIn("alarm_code", event)
        self.assertIn("abnormal_metrics", event)
        self.assertIn("realtime_snapshot", event)
        self.assertIn("trigger_rules", event)
        self.assertIn("timestamp", event)

    def test_monitor_can_use_another_temperature_and_vibration_point_profile(self):
        monitor = DeviceMonitor()
        sample = DeviceSample(
            device_id="CNC-001",
            timestamp=self.start,
            temperature=51.0,
            vibration=2.1,
            rpm=6000.0,
            temperature_point="electrical_cabinet",
            vibration_point="turret_vibration",
        )

        result = monitor.observe(sample)

        self.assertEqual(result.observations[0].monitoring_point, "electrical_cabinet")
        self.assertEqual(result.observations[0].threshold, 50.0)
        self.assertEqual(result.observations[1].monitoring_point, "turret_vibration")
        self.assertEqual(result.observations[1].threshold, 2.0)

    def test_runner_switch_controls_single_sample_processing(self):
        monitor = DeviceMonitor()
        calls = []

        def provider():
            calls.append(True)
            return self.sample(len(calls), temperature=50.0, vibration=1.0)

        runner = MonitorRunner(monitor, provider)
        runner.set_enabled(False)
        self.assertIsNone(runner.run_once())
        self.assertEqual(calls, [])

        runner.set_enabled(True)
        self.assertIsNotNone(runner.run_once())
        self.assertEqual(len(calls), 1)

    def test_runner_automatically_reads_until_stopped(self):
        monitor = DeviceMonitor()
        calls = []
        calls_lock = Lock()
        first_sample = Event()

        def provider():
            with calls_lock:
                index = len(calls)
                calls.append(index)
            first_sample.set()
            return self.sample(index, temperature=50.0, vibration=1.0)

        runner = MonitorRunner(monitor, provider, interval_seconds=0.01)
        runner.start()
        self.assertTrue(first_sample.wait(1.0))
        deadline = monotonic() + 1.0
        while monotonic() < deadline:
            with calls_lock:
                if len(calls) >= 2:
                    break
            sleep(0.01)
        runner.stop(timeout=1.0)

        self.assertFalse(runner.running)
        self.assertGreaterEqual(len(calls), 2)

    def test_runner_can_be_disabled_and_enabled_while_running(self):
        monitor = DeviceMonitor()
        calls = []

        def provider():
            index = len(calls)
            calls.append(index)
            return self.sample(index, temperature=50.0, vibration=1.0)

        runner = MonitorRunner(monitor, provider, interval_seconds=0.01)
        runner.start()
        deadline = monotonic() + 1.0
        while len(calls) == 0 and monotonic() < deadline:
            sleep(0.01)
        runner.set_enabled(False)
        paused_count = len(calls)
        sleep(0.05)
        self.assertEqual(len(calls), paused_count)

        runner.set_enabled(True)
        deadline = monotonic() + 1.0
        while len(calls) == paused_count and monotonic() < deadline:
            sleep(0.01)
        runner.stop(timeout=1.0)
        self.assertGreater(len(calls), paused_count)

    def test_factory_snapshot_provider_maps_live_api_shape(self):
        class FakeFactoryClient:
            def snapshot(self, device_id):
                self.requested_device_id = device_id
                return {
                    "summary": {"updated_at": 1789379084087},
                    "devices": [
                        {
                            "device_id": device_id,
                            "status": "running",
                            "mode": "AUTO",
                            "cycle_state": "idle",
                            "metrics": {
                                "spindle_rpm": 1932.0,
                                "spindle_temperature_c": 46.8,
                                "spindle_load_percent": 35.2,
                            },
                        }
                    ],
                    "monitor": {
                        "device_id": device_id,
                        "status": "running",
                        "mode": "AUTO",
                        "cycle_state": "idle",
                        "alarm_code": "",
                        "metrics": {
                            "spindle_rpm": 1932.0,
                            "spindle_temperature_c": 46.8,
                            "spindle_load_percent": 35.2,
                        },
                    },
                    "scenarios": {"active_scenario": None, "scenarios": []},
                }

        client = FakeFactoryClient()
        provider = FactorySnapshotProvider(client, "TRAK-TC820LTYSI-001")
        sample = provider.read()

        self.assertEqual(client.requested_device_id, "TRAK-TC820LTYSI-001")
        self.assertEqual(sample.device_id, "TRAK-TC820LTYSI-001")
        self.assertEqual(sample.temperature, 46.8)
        self.assertIsNone(sample.vibration)
        self.assertEqual(sample.rpm, 1932.0)
        self.assertEqual(sample.metrics["spindle_load_percent"], 35.2)

    def test_factory_snapshot_provider_maps_health_score_and_metric_details(self):
        class FakeFactoryClient:
            def snapshot(self, device_id):
                return {
                    "devices": [{
                        "device_id": device_id,
                        "health_score": 87,
                        "metrics": {"hydraulic_pressure_psi": 700},
                        "metric_details": {
                            "hydraulic_pressure_psi": {
                                "label": "液压总压力",
                                "unit": "psi",
                                "normal_range": [680, 720],
                                "warn_range": [635, 670],
                                "alarm_range": [470, 620],
                            }
                        },
                    }],
                    "monitor": {"device_id": device_id, "metrics": {}},
                }

        sample = FactorySnapshotProvider(
            FakeFactoryClient(), "TRAK-TC820LTYSI-001"
        ).read()

        self.assertEqual(sample.health_score, 87.0)
        self.assertIn("hydraulic_pressure_psi", sample.metric_details)

    def test_metric_details_monitor_the_full_machine_metric_catalog(self):
        details = {
            "hydraulic_pressure_psi": {
                "label": "液压总压力",
                "unit": "psi",
                "group": "液压",
                "normal_range": [680, 720],
                "warn_range": [635, 670],
                "alarm_range": [470, 620],
            },
            "coolant_level_percent": {
                "label": "冷却液液位",
                "unit": "%",
                "group": "冷却",
                "normal_range": [65, 90],
                "warn_range": [50, 62],
                "alarm_range": [18, 48],
            },
        }
        sample = DeviceSample(
            device_id="CNC-001",
            timestamp=self.start,
            temperature=50.0,
            vibration=None,
            rpm=1800.0,
            metrics={
                "hydraulic_pressure_psi": 600.0,
                "coolant_level_percent": 40.0,
            },
            metric_details=details,
        )

        result = DeviceMonitor(
            MonitorConfig(abnormal_duration_seconds=99, abnormal_occurrence_threshold=99)
        ).observe(sample)

        keys = {item.key for item in result.observations}
        self.assertIn("metric:hydraulic_pressure_psi", keys)
        self.assertIn("metric:coolant_level_percent", keys)
        hydraulic = next(
            item for item in result.observations if item.key == "metric:hydraulic_pressure_psi"
        )
        coolant = next(
            item for item in result.observations if item.key == "metric:coolant_level_percent"
        )
        self.assertEqual(hydraulic.alert_level, AlertLevel.HIGH)
        self.assertEqual(coolant.alert_level, AlertLevel.HIGH)
        self.assertEqual(hydraulic.group, "液压")
        self.assertEqual(coolant.group, "冷却")

    def test_full_machine_multi_metric_rule_includes_non_temperature_metrics(self):
        details = {
            "spindle_temperature_c": {
                "label": "主轴温度",
                "unit": "°C",
                "group": "主轴",
                "normal_range": [38, 56],
                "warn_range": [58, 65],
                "alarm_range": [66, 88],
            },
            "spindle_load_percent": {
                "label": "主轴负载",
                "unit": "%",
                "group": "主轴",
                "normal_range": [22, 48],
                "warn_range": [55, 68],
                "alarm_range": [75, 92],
            },
        }
        sample = DeviceSample(
            device_id="CNC-001",
            timestamp=self.start,
            temperature=82.0,
            vibration=None,
            rpm=3800.0,
            metrics={"spindle_temperature_c": 82.0, "spindle_load_percent": 84.0},
            metric_details=details,
        )

        result = DeviceMonitor().observe(sample)

        self.assertTrue(result.agent_should_run)
        combined = next(
            item
            for item in result.trigger.abnormal_events
            if item.rule_type == RuleType.MULTI_METRIC
        )
        self.assertEqual(combined.related_keys, ("temperature", "metric:spindle_load_percent"))
        self.assertEqual(combined.alert_level, AlertLevel.HIGH)
        self.assertIn("多指标规则：同时存在 2 个异常指标", result.trigger.trigger_reasons)


if __name__ == "__main__":
    unittest.main()
