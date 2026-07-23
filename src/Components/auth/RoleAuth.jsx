import { Navigate, Outlet } from "react-router-dom";
import { routes } from "../../routes";
import { getAuthRole } from "../../utils/authSession";

/**
 * Restricts a group of routes to a specific panel role ("store" | "admin").
 * If the stored role does not match, the user is sent back to the login page.
 */
const RoleAuth = ({ allowedRole }) => {
  const role = getAuthRole();
  return role === allowedRole ? (
    <Outlet />
  ) : (
    <Navigate to={routes.LOGIN} replace />
  );
};

export default RoleAuth;
