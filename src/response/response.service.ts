import { Injectable } from '@nestjs/common';
import {
    SystemSuccessStatusCode,
    SystemErrorStatusCode,
    ResponseMessage
} from 'response/response.constant';
import {
    IApiMessage,
    IApiErrors,
    IApiErrorMessage,
    IApiErrorResponse,
    IApiSuccessResponse,
    IApiRawMessage
} from 'response/response.interface';
import { LanguageService } from 'language/language.service';
import { Logger as LoggerService } from 'winston';
import { Logger } from 'middleware/logger/logger.decorator';
import { Language } from 'language/language.decorator';

@Injectable()
export class ResponseService {
    constructor(
        @Logger() private readonly logger: LoggerService,
        @Language() private readonly languageService: LanguageService,
    ) {}

    private setMessage(
        statusCode: SystemErrorStatusCode | SystemSuccessStatusCode
    ): IApiMessage {
        const message: IApiRawMessage[] = ResponseMessage.filter(val => {
            const statusCodeMerge: Record<string, any> = {
                ...SystemErrorStatusCode,
                ...SystemSuccessStatusCode
            };
            return val.statusCode === statusCodeMerge[statusCode];
        });
        return {
            statusCode: statusCode,
            message: this.languageService.get(message[0].message)
        };
    }

    setErrorMessage(errors: IApiErrors[]): IApiErrorMessage[] {
        const newError: IApiErrorMessage[] = [];
        errors.forEach((value: IApiErrors) => {
            const error: IApiMessage = this.setMessage(value.statusCode);
            newError.push({
                property: value.property,
                message: error.message
            });
        });
        return newError;
    }

    setRequestErrorMessage(
        rawErrors: Record<string, any>[]
    ): IApiErrorMessage[] {
        const errors: IApiErrorMessage[] = rawErrors.map(value => {
            for (const [i, k] of Object.entries(value.constraints)) {
                return {
                    property: value.property,
                    message: this.languageService
                        .get(`request.${i}`)
                        .replace('$property', value.property)
                        .replace('$value', value.value)
                };
            }
        });
        return errors;
    }

    error(
        statusCode: SystemErrorStatusCode,
        errors?: IApiErrorMessage[]
    ): IApiErrorResponse {
        const message: IApiMessage = this.setMessage(statusCode);
        const response: IApiErrorResponse = {
            statusCode,
            message: message.message,
            errors
        };

        this.logger.error('Error', response);
        return response;
    }

    success(
        statusCode: SystemSuccessStatusCode,
        data?: Record<string, any> | Record<string, any>[]
    ): IApiSuccessResponse {
        const message: IApiMessage = this.setMessage(statusCode);
        const response: IApiSuccessResponse = {
            statusCode,
            message: message.message,
            data
        };

        this.logger.info('Success', response);
        return response;
    }

    raw(response: Record<string, any>): Record<string, any> {
        this.logger.info('Raw', response);
        return response;
    }
}
