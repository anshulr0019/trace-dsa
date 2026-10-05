# Java runtime assets

`tools.jar` is the unmodified compiler from Eclipse Temurin OpenJDK 8u504-b01
(Linux x64). It is platform-independent Java bytecode. Its GPLv2 licence with
Classpath Exception, assembly exception and third-party notices are included.
Corresponding source: https://github.com/adoptium/jdk8u/tree/jdk8u504-b01
Binary distribution: https://github.com/adoptium/temurin8-binaries/releases/tag/jdk8u504-b01

`trace-runtime.jar` is built from this project's `runtime/java/*.java` with a JDK:

    javac --release 8 -d /tmp/trace-java-classes runtime/java/*.java
    jar cf runtime/vendor/java/trace-runtime.jar -C /tmp/trace-java-classes .

The JVM is CheerpJ 4.3, loaded directly from the official CDN. It is not
redistributed in this repository. CheerpJ's current Community License covers
qualifying individuals and one-person companies, including revenue-generating
projects with appropriate credits. Company, redistribution and OEM uses may
require different terms. Review the intended deployment against the official
terms: https://cheerpj.com/docs/licensing.html

Java source and input execute in a disposable worker on the user's device.
Only runtime assets are downloaded. No remote code execution service is used.
