import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { EncryptionOption } from 'aws-cdk-lib/aws-stepfunctions-tasks';

export interface HitCounterProps {
    /** the function for which we want to count url hits */
    downstream: lambda.IFunction;

    /**
     * read capacity units for table
     * 
     * Must b greater than 5 and lower than 20
     * 
     * @default 5
     */
    readCapacity?: number;
}

export class HitCounter extends Construct {

    /** allows accessing the counter function */
    public readonly handler: lambda.Function;

    /**the hit counter table */
    public readonly table: dynamodb.Table;

    constructor(scope: Construct, id: string, props: HitCounterProps) {

        if (props.readCapacity !== undefined && (props.readCapacity < 5 || props.readCapacity > 20)){
            throw new Error('readCapacity must be greater than 5 and less than 20');
        }

        super(scope, id);

        //TODO
        const table = new dynamodb.Table(this, 'Hits', {
            partitionKey: { name: 'path', type: dynamodb.AttributeType.STRING },
            removalPolicy: cdk.RemovalPolicy.DESTROY
            
        });
        this.table = table;

        this.handler = new lambda.Function(this, 'HitCounterHandler', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'hitcounter.registerHit',
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