const UAT_URL = "https://uat-tanishqdigitalmerch.titan.in:8443/ThirdEyeApp";
const PROD_URL = "https://tanishqdigitalmerch.titan.in:8443/ThirdEyeApp";

const hostname = window.location.hostname;

let HOST_URL;

switch (hostname) {
  case "localhost":
  case "uat-tanishqdigitalmerch.titan.in":
    HOST_URL = UAT_URL;
    break;

  case "tanishqdigitalmerch.titan.in":
    HOST_URL = PROD_URL;
    break;

  default:
    HOST_URL = UAT_URL;
}

export { HOST_URL };
