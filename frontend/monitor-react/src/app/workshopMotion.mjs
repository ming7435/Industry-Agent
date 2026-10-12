const STOP_STATES = new Set(['stopping', 'stopped', 'paused', 'emergency_stop', 'e_stop', 'halted']);
const normalize = value => String(value || '').trim().toLowerCase();
const sampleFor = machine => machine?.result?.current_sample || machine?.sample;

function panelStartsAfterStop(machines, line, now) {
  // Display actual panel-started devices without rewriting or verifying the
  // safety ledger. A newer stop, partial start or uncertain sample still freezes.
  const stoppedAt = typeof line?.updated_at === 'number' ? line.updated_at * 1000 : NaN;
  const controls = line?.devices;
  if (!Number.isFinite(stoppedAt) || stoppedAt <= 0 || stoppedAt > now
    || !controls || typeof controls !== 'object' || Array.isArray(controls)
    || !machines.length || Object.keys(controls).length !== machines.length
    || new Set(machines.map(machine => machine.id)).size !== machines.length) return false;
  return machines.every(machine => {
    const sample = sampleFor(machine), previous = controls[machine.id];
    const sampledAt = Date.parse(sample?.timestamp), startedAt = sample?.control_updated_at;
    return previous?.state === 'verified' && ['stop', 'emergency_stop'].includes(previous.action)
      && previous.snapshot?.device_id === machine.id && STOP_STATES.has(normalize(previous.snapshot.status))
      && sample?.device_id === machine.id && normalize(machine.result?.status) === 'normal'
      && normalize(sample.status) === 'running' && normalize(sample.control_state) === 'running'
      && getMachineMotionState(machine) === 'running'
      && sample.control_reason === 'operator panel start'
      && (sample.alarm_code === null || sample.alarm_code === '')
      && typeof startedAt === 'number' && Number.isFinite(startedAt)
      && startedAt > stoppedAt && startedAt <= now && startedAt <= sampledAt
      && Number.isFinite(sampledAt) && Math.abs(now - sampledAt) <= 10000;
  });
}

export function getMachineMotionState(machine) {
  if (!machine?.live) return 'unknown';
  const sample = sampleFor(machine);
  const states = [sample?.status, sample?.control_state].map(normalize).filter(Boolean);
  if (states.some(state => STOP_STATES.has(state)) || STOP_STATES.has(normalize(machine.result?.status))) return 'stopped';
  if (normalize(machine.result?.status) === 'fault') return 'fault';
  return states.length && states.every(state => state === 'running') ? 'running' : 'unknown';
}

export function getWorkshopMotionState({ machines = [], line, runner = {}, unavailable = false, now = Date.now() } = {}) {
  const paused = (label, reason) => ({ running: false, label, reason });
  if (unavailable || runner.last_error) return paused('画面已暂停', '运行状态暂不可用，等待重新连接');
  if (runner.enabled === false || runner.running === false) return paused('画面已暂停', '实时监控已暂停');
  // Read the shared line ledger, not the monitor process's last stop callback:
  // restart control is performed by another service.
  const lineStatus = normalize(line?.state);
  const physical = machines.filter(machine => !machine.visualOnly);
  const panelStarted = lineStatus === 'stopped' && panelStartsAfterStop(physical, line, now);
  if (!['running', 'unknown'].includes(lineStatus) && !panelStarted) {
    if (lineStatus === 'starting') return paused('整线画面已暂停', '正在启动全部设备，启动后自动恢复运动');
    if (lineStatus === 'stopping') return paused('整线画面已暂停', '正在停止全部设备');
    if (lineStatus === 'stopped') return paused('整线画面已暂停', '等待维修人员确认完成并启动设备');
    return paused('画面已暂停', '等待整线运行状态确认');
  }
  if (!physical.length) return paused('画面已暂停', '等待设备实时数据');
  const states = physical.map(getMachineMotionState);
  if (states.includes('stopped') || states.includes('fault')) return paused('整线画面已暂停', '设备已停机或确认故障，等待整线恢复');
  const stale = physical.some(machine => {
    const timestamp = Date.parse(sampleFor(machine)?.timestamp);
    return !Number.isFinite(timestamp) || now - timestamp > 10000 || timestamp - now > 10000;
  });
  if (stale || states.some(state => state !== 'running')) return paused('画面已暂停', '等待全部设备的最新运行数据');
  const validUntil = Math.min(...physical.map(machine => Date.parse(sampleFor(machine).timestamp))) + 10000;
  if (panelStarted) return { running: true, validUntil, auditPending: true,
    label: '设备画面运行中', reason: '设备已在面板启动；整线停机记录待对账' };
  return { running: true, validUntil, label: '整线画面运行中', reason: '随设备状态同步停机与恢复' };
}

export function createMotionClock() {
  let time = 0;
  let previousTime = null;
  let previouslyRunning = false;
  return {
    tick(now, running) {
      // Discard time spent paused, hidden or awaiting the next live sample.
      const delta = running && previouslyRunning && previousTime !== null
        ? Math.min(0.1, Math.max(0, (now - previousTime) / 1000)) : 0;
      previousTime = now;
      previouslyRunning = running;
      time += delta;
      return { time, delta };
    },
  };
}
