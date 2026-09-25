import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// High bitrate so Instagram's re-encode still looks clean (see qa/qa.py floor).
Config.setCodec("h264");
Config.setCrf(16);
// WebGL on the GPU. Chrome's default in headless mode is software rendering:
// ~7 s/frame for a phone reel, against ~0.2 s/frame here, with identical frames.
Config.setChromiumOpenGlRenderer("angle");
// The phone's video texture comes through OffthreadVideo, whose frame cache
// defaults to half the free RAM -- enough to get a long T3 take killed.
Config.setOffthreadVideoCacheSizeInBytes(512 * 1024 * 1024);
// One frame at a time. Remotion's default is half the logical cores (8 on
// this 16-thread machine): eight Chrome tabs, each with its own WebGL context
// at dpr 2 and its own share of the video cache, which starves the desktop
// and 16 GB of RAM. A phone reel is GPU-bound anyway, so extra tabs add
// memory pressure, not speed. A CLI --concurrency still overrides this.
Config.setConcurrency(1);
