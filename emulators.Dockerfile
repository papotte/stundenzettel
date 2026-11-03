FROM node:24-alpine

# Install JDK (required by the Java-based emulators)
RUN apk add --no-cache openjdk21-jre-headless

# Install the firebase cli
ARG FIREBASE_VERSION=latest
RUN npm install -g firebase-tools@${FIREBASE_VERSION} \
  && npm cache clean --force

# Pre-download the emulator artifacts so startup does not hit the network
RUN firebase setup:emulators:firestore \
  && firebase setup:emulators:ui

WORKDIR /firebase

# Copy only what the emulators need
COPY firebase.json .firebaserc firestore.rules firestore.indexes.json ./
COPY functions/package.json functions/package-lock.json ./functions/
RUN npm --prefix functions ci
COPY functions ./functions
RUN npm --prefix functions run build

#       UI     HUB    STORE   FUNC    AUTH
EXPOSE  14000  14400  18080   19001   19099

# Mount your emulator export directory at /firebase/data and (optionally)
# functions/src at /firebase/functions/src when running the container.
# Data is imported on startup and exported again on shutdown. The tsc watch
# picks up changes to the mounted function sources so the Functions emulator
# hot-reloads them without an image rebuild.
CMD ["sh", "-c", "npm --prefix functions run build && npm --prefix functions run build:watch & exec firebase emulators:start --only auth,firestore,functions --import=/firebase/data --export-on-exit=/firebase/data --project=${FIREBASE_PROJECT}"]
