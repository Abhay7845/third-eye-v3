import { Navigate, Outlet } from "react-router-dom";
import { routes } from "../../routes";
import { isAuthSessionValid } from "../../utils/authSession";

const PrivateAuth = () => {
  const isToken = isAuthSessionValid();
  return (
    <div>{isToken ? <Outlet /> : <Navigate to={routes.LOGIN} replace />}</div>
  );
};

export default PrivateAuth;
