import AWS from 'aws-sdk';

export default class SSM {
  ssm: AWS.SSM

  constructor() {
    this.ssm = new AWS.SSM({
      apiVersion: '2014-11-06',
      region: process.env.AWS_REGION,
    });
  }

  public async getParameter(name: string): Promise<string | undefined> {
    const data = await this.ssm.getParameter({
      Name: name,
      WithDecryption: true,
    }).promise();
    return data.Parameter?.Value;
  }
}
