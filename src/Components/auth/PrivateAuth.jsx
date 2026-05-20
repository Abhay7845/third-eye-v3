import { Navigate, Outlet } from "react-router-dom";
import { routes } from "../../routes";

const PrivateAuth = () => {
  const isToken = localStorage.getItem("3rd_eye_auth_token") === "true";
  return (
    <div>{isToken ? <Outlet /> : <Navigate to={routes.LOGIN} replace />}</div>
  );
};

export default PrivateAuth;
