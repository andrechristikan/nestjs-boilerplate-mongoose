import {
    SystemSuccessStatusCode,
    SystemErrorStatusCode
} from 'response/response.constant';

// response
export interface IApiSuccessResponse {
    statusCode: SystemSuccessStatusCode;
    message: string;
    data?: Record<string, any> | Record<string, any>[];
}

export interface IApiErrorResponse {
    statusCode: SystemErrorStatusCode;
    message: string;
    errors?: IApiErrorMessage[];
}

// errors
export interface IApiErrors {
    statusCode: SystemErrorStatusCode;
    property: string;
}

export interface IApiErrorMessage {
    message: string;
    property: string;
}

// set message
export interface IApiMessage {
    message: string;
    statusCode: SystemErrorStatusCode | SystemSuccessStatusCode;
}

export interface IApiRawMessage {
    message: string;
    statusCode: string;
}
