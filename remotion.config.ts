import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// h264 + AAC, boa qualidade sem arquivo gigante
Config.setCodec('h264');
Config.setCrf(20);
