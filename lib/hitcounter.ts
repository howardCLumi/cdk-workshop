import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { EncryptionOption } from 'aws-cdk-lib/aws-stepfunctions-tasks';

export interface HitCounterProps {
    /** the function for which we want to count url hits */
    downstream: lambda.IFunction;
}

export class HitCounter extends Construct {

    /** allows accessing the counter function */
    public readonly handler: lambda.Function;

    /**the hit counter table */
    public readonly table: dynamodb.Table;

    constructor(scope: Construct, id: string, props: HitCounterProps) {
        super(scope, id);

        //TODO
        const table = new dynamodb.Table(this, 'Hits', {
            partitionKey: { name: 'path', type: dynamodb.AttributeType.STRING },
            encryption: dynamodb.TableEncryption.AWS_MANAGED
        });
        this.table = table;

        this.handler = new lambda.Function(this, 'HitCounterHandler', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'hitcounter.handler',
            code: lambda.Code.fromAsset('lambda'),
            environment: {
                DOWNSTREAM_FUNCTION_NAME: props.downstream.functionName,
                HITS_TABLE_NAME: table.tableName
            }
        });

        //grants lambda role r/w perms to table
        table.grantReadWriteData(this.handler);

        //grants lambda role invoke perms to the downstream function
        props.downstream.grantInvoke(this.handler);
    }
}

/**
 * what is invoke permissions
 */