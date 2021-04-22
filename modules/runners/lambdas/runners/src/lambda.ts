import { scaleUp as scaleUp_ } from './scale-runners/scale-up';
import { scaleDown as scaleDown_ } from './scale-runners/scale-down';
import { SQSEvent, ScheduledEvent, Context } from 'aws-lambda';

export async function scaleUp(event: SQSEvent, context: Context, callback: any) {
  console.dir(event, { depth: 5 });
  try {
    for (const e of event.Records) {
      await scaleUp_(e.eventSource, JSON.parse(e.body));
    }
    return callback(null);
  } catch (e) {
    console.error(e);
    return callback('Failed handling SQS event');
  }
}

export async function scaleDown(event: ScheduledEvent, context: Context, callback: any) {
  try {
    scaleDown_();
    return callback(null);
  } catch (e) {
    console.error(e);
    return callback('Failed');
  }
}
