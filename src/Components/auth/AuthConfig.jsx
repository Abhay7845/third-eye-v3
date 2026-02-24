import { routes } from "../../routes";
const clientId = "78b40c9c-99fd-4721-b5f3-bd5a7353bfd0"; //UAT
const tenantId = "7cc91c38-648e-4ce2-a4e4-517ae39fc189"; // UAT

// const clientId = "0a373071-17ca-4b77-8fb9-483e42266057"; //PROD
// const tenantId = "7cc91c38-648e-4ce2-a4e4-517ae39fc189"; // PROD

export const msalConfig = {
  auth: {
    clientId: clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: routes.NEW_STORE,
  },
};

export const loginRequest = {
  scopes: ["openid", "profile", "email", `api://${clientId}/access_as_user`],
};
