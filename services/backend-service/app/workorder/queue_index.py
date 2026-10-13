"""Small queue records; full repair evidence is read only for selected tasks."""
import json


FIELDS = ('workorder_id','device_id','event_id','event_revision','tenant_id','project_id',
          'status','assignee','assignee_name','title','source','dispatch_mode','priority',
          'created_at','updated_at','deleted_at','_revision')


def queue_index_sql(mysql=False):
    def extract(path):
        value="JSON_EXTRACT(payload,'"+path+"')"
        return 'JSON_UNQUOTE('+value+')' if mysql else value
    def usable(path):
        return "NULLIF(NULLIF("+extract(path)+",''),'null')"
    pairs=[]
    for field in FIELDS:
        pairs.extend(("'"+field+"'", "JSON_EXTRACT(payload,'$."+field+"')"))
    for field in ('plan_id','plan_kind','inspection_required'):
        pairs.extend(("'"+field+"'", "COALESCE(JSON_EXTRACT(payload,'$."+field+"'),"
            "JSON_EXTRACT(payload,'$.maintenance_plan_snapshot."+field+"'),"
            "JSON_EXTRACT(payload,'$.maintenance_plan."+field+"'))"))
    alarms=[usable('$.alarm_code')]
    for source in ('diagnosis_snapshot','diagnosis_context','maintenance_plan_snapshot.diagnosis'):
        paths=[usable('$.'+source+'.'+('raw.'*depth)+'alarm_code') for depth in range(7)]
        identity=usable('$.'+source+'.device_id')
        alarms.append('CASE WHEN '+identity+' IS NULL OR '+identity+'='+extract('$.device_id')
                      +' THEN COALESCE('+','.join(paths)+') ELSE NULL END')
    pairs.extend(("'alarm_code'",'COALESCE('+','.join(alarms)+')'))
    # Legacy soft deletions retain only the identifiers needed to hide old plans.
    pairs.extend(("'maintenance_plan_snapshot'", "CASE WHEN "+usable('$.deleted_at')+" IS NOT NULL THEN JSON_OBJECT('plan_id',JSON_EXTRACT(payload,'$.maintenance_plan_snapshot.plan_id')) ELSE NULL END"))
    pairs.extend(("'plan_revisions'", "CASE WHEN "+usable('$.deleted_at')+" IS NOT NULL THEN JSON_EXTRACT(payload,'$.plan_revisions') ELSE NULL END"))
    return 'JSON_OBJECT('+','.join(pairs)+')'


def read_queue_index(rows):
    result=[]
    for row in rows:
        item={key:value for key,value in json.loads(row[0]).items() if value is not None}
        item.setdefault('alarm_code','')
        item['_summary_record']=True
        result.append(item)
    return result
