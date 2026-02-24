import tanishq from "../../asset/channelLogo/Tanishq.png";
import taneira from "../../asset/channelLogo/taneira.png";
import fastTrack from "../../asset/channelLogo/fastTrack.png";
import titanEyeplus from "../../asset/channelLogo/TitanEyeplus.png";
import helios from "../../asset/channelLogo/helios.png";
import wot from "../../asset/channelLogo/wot_logo_only.png";
import mia from "../../asset/channelLogo/MIA.png";
import zoya from "../../asset/channelLogo/zoya.png";
import irth from "../../asset/channelLogo/irth.png";
import skinn from "../../asset/channelLogo/skkin.png";

const chl_logo = {
  tanishq: tanishq,
  wot: wot,
  eyewear: titanEyeplus,
  helios: helios,
  fastrack: fastTrack,
  mia: mia,
  lwot: "",
  mbo: "",
  tar: taneira,
  zoya: zoya,
  irth: irth,
  skinn:skinn,
};


export const GetChannelLogo = (chl) => {
    for (const [key, value] of Object.entries(chl_logo)) {
      if (key === chl) {
        return value;
      }
    }
    return null;
  }