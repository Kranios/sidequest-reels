import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// High bitrate so Instagram's re-encode still looks clean (see qa/qa.py floor).
Config.setCodec("h264");
Config.setCrf(16);
