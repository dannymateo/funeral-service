export interface Permission {
	entityName: string;
	canCreate?: boolean;
	canRead?: boolean;
	canUpdate?: boolean;
	canDelete?: boolean;
}