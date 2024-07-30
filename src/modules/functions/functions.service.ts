import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { generate } from 'otp-generator';

import { GenerateResponseApi } from './functions.types';
import { Messages } from '../../common/enums';

@Injectable()
export class FunctionsService {
	/**
	 * The function `generateResponseApi` generates a response object based on input values and throws an
	 * `HttpException` if the type is not 'Objet'.
	 * @param {GenerateResponseApi} values - The `values` parameter in the `generateResponseApi` function
	 * contains the following properties:
	 * - `ok` (optional): A boolean value that indicates if the request was successful.
	 * - `status` (optional): An HTTP status code for the response.
	 * - `message` (optional): A message to be included in the response.
	 * - `data` (optional): Additional data to be included in the response.
	 * - `meta` (optional): An object containing metadata for the response, such as pagination information.
	 * - `issues` (optional): An array of issues or errors to be included in the response.
	 * @param {'HttpException' | 'Objet'} type - The `type` parameter in the `generateResponseApi` function
	 * specifies the type of response to generate. It can be either `'HttpException'` or `'Objet'`. If the
	 * type is `'Objet'`, the function will return the response object. If the type is `'HttpException'`,
	 * @returns The function `generateResponseApi` will return the `response` object if the `type`
	 * parameter is set to 'Objet'. Otherwise, it will throw an `HttpException` with the `response` object
	 * and the specified status code.
	 */
	generateResponseApi(values: GenerateResponseApi, type: 'HttpException' | 'Objet' = 'HttpException') {
		const { ok, status, message, data, issues, meta } = values;

		const response = {
			ok: ok || false,
			status: status || HttpStatus.INTERNAL_SERVER_ERROR,
			message: !message && !ok ? Messages.INTERNAL_SERVER_ERROR : message || Messages.SUCCESSFUL,
			data: data,
			meta: meta,
			issues: issues,
		};

		if (type === 'Objet') return response;
		else throw new HttpException(response, status || HttpStatus.INTERNAL_SERVER_ERROR);
	}

	/**
	 * The function `generateOTP` generates a random OTP (One-Time Password) based on the specified type.
	 * @param {'code' | 'password'} type - The `type` parameter in the `generateOTP` function specifies
	 * the type of OTP to generate. It can be either `'code'` or `'password'`. If the type is `'code'`,
	 * the function will generate a 6-digit numeric OTP. If the type is `'password'`, the function will
	 * generate a 12-character alphanumeric OTP.
	 * @returns The function `generateOTP` will return a randomly generated OTP based on the specified type.
	 */
	generateOTP = (type: 'code' | 'password') => {
		if (type === 'password') {
			let password = '';

			while (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,50}$/.test(password)) {
				password = generate(20, {
					digits: true,
					lowerCaseAlphabets: true,
					upperCaseAlphabets: true,
					specialChars: true,
				});
			}

			return password;
		} else {
			return generate(6, {
				digits: true,
				lowerCaseAlphabets: false,
				upperCaseAlphabets: false,
				specialChars: false,
			});
		}
	};
}