import AWS from 'aws-sdk';

AWS.config.update({
  region: process.env.AWS_REGION,
});

const ssm = new AWS.SSM({ apiVersion: '2014-11-06' });

export async function fetch_parameter(name: string): Promise<string | undefined> {
  const data = await ssm.getParameter({
    Name: name,
    WithDecryption: true,
  }).promise();
  return data.Parameter?.Value;
}
