#!/usr/bin/env bash

echo "xcrun simctl shutdown all && xcrun simctl erase all"
xcrun simctl shutdown all && xcrun simctl erase all
