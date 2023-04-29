import { Permission } from "../../models";
import { 
    PermissionInterface,
    PermissionEditRequestType,
    PermissionCreationRequestType 
} from "../../models/permission/IPermission";

export interface IPermissionService {
    /**
     * Create a new permission for a platform
     * 
     * @param payload 
     * @returns 
     */
    createPermission (
        payload: PermissionCreationRequestType|PermissionCreationRequestType[]
    ):  Promise<Array<Permission>>

    /**
     * Update an existing permission
     * 
     * @param permissionId 
     * @param payload 
     * @returns 
     */
    updatePermission (
        permissionId: string, 
        payload: PermissionEditRequestType
    ):  Promise<Permission>

    /**
     * List all permissions tied to a business
     * 
     * @returns 
     */
    listPermissions ():  Promise<Array<Permission>>

    /**
     * Find an existing permission
     * 
     * @param identifier 
     * @returns 
     */
     findPermission(identifier: string): Promise<Permission>

    /**
     * Delete an existing permission
     * 
     * @param identifier 
     * @returns 
     */
    deletePermission (identifier: string): Promise<void>
}