import { HttpStatus } from '@nestjs/common';

interface GenerateResponseApi {
	ok?: boolean;
	status?: HttpStatus;
	message?: string;
	data?: any[];
	meta?: {
		page?: number;
		pageSize?: number;
		totalPages?: number;
		total?: number;
		search?: string;
	};
	issues?: any[];
}

export type { GenerateResponseApi };