import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import ABCJS from "abcjs";

import { useEffect } from "react";

let LOGGING = true;

let log = LOGGING ? console.log : () => {};

function characterToABC(char) {
  if (char.length == 1) {
    let regexToABC = {};
    let characterList = [
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "j",
      "k",
      "l",
      "m",
      "n",
      "o",
      "p",
      "q",
      "r",
      "s",
      "t",
      "u",
      "v",
      "w",
      "x",
      "y",
      "z",
      "-.!–—,…?:;",
    ];
    let regexList = characterList.map((c) => new RegExp(`[${c}]`, "i"));
    let skipRegex = characterList;
    skipRegex = `[^${skipRegex.reverse().join("")}]`;
    regexList.push(new RegExp(`[^${characterList.join("")}]`, "i"));
    let abcList = [
      "a",
      "^a",
      "b",
      "c'",
      "^c'",
      "d'",
      "^d'",
      "e'",
      "f'",
      "^f'",
      "g'",
      "^g'",
      "a'",
      "A",
      "^A",
      "B",
      "c",
      "^c",
      "d",
      "^d",
      "e",
      "f",
      "^f",
      "g",
      "^g",
      "A",
      "z",
    ];
    return abcList[regexList.findIndex((r) => r.test(char))];
  } else {
    console.error(
      "`characterToABC expects one character, received",
      char.length
    );
    return false;
  }
}

function abcify(string) {
  return string.split("").map(characterToABC);
}

function getTimeSignature() {
  let timeSignatures = ["4/4", "3/4", "6/8", "7/8"].map((sig) => {
    let [beatsPerMeasure, beatNoteLength] = sig
      .split("/")
      .map((c) => parseInt(c));
    return { beatsPerMeasure: beatsPerMeasure, beatNoteLength: beatNoteLength };
  });
  return timeSignatures[Math.floor(Math.random() * timeSignatures.length)];
}

function getKey() {
  return "C";
}

function getHeader() {
  let saxophoneMIDIindices = {
    soprano_sax: 64,
    alto_sax: 65,
    tenor_sax: 66,
    baritone_sax: 67,
  };

  let timeSignature = getTimeSignature();
  log(
    `The time signature is ${timeSignature.beatsPerMeasure}/${timeSignature.beatNoteLength}`
  );
  return [
    // `T: ${"Title"}`, // T represents the title, which we're setting as blank by default
    `M: ${timeSignature.beatsPerMeasure}/${timeSignature.beatNoteLength}`,
    `L: 1/8`,
    `K: ${getKey()}`,
    `[I:MIDI= program ${saxophoneMIDIindices["alto_sax"]} ]`,
  ].join("\n");
}

export default function Home() {
  let saxophoneMIDIindices = {
    soprano_sax: 64,
    alto_sax: 65,
    tenor_sax: 66,
    baritone_sax: 67,
  };

  // var abc =
  //   "T: Cooley's\n" +
  //   "M: 4/4\n" +
  //   "L: 1/8\n" +
  //   "K: Emin\n" +
  //   `[I:MIDI= program ${saxophoneMIDIindices["alto_sax"]} ]` +
  //   "|:D2|EB{c}BA B2 EB|~B2 AB dBAG|FDAD BDAD|FDAD dAFD|\n" +
  //   "EBBA B2 EB|B2 AB defg|afe^c dBAF|DEFD E2:|\n" +
  //   "|:gf|eB B2 efge|eB B2 gedB|A2 FA DAFA|A2 FA defg|\n" +
  //   "eB B2 eBgB|eB B2 defg|afe^c dBAF|DEFD E2:|=";

  var audioContext, midiBuffer;
  useEffect(() => {
    let secretInput = document.querySelector("#secret input[type='text']");
    secretInput.value = "abcdefghijklmnopqrstuvwxyz";
    window.AudioContext =
      window.AudioContext ||
      window.webkitAudioContext ||
      navigator.mozAudioContext ||
      navigator.msAudioContext;

    audioContext = new window.AudioContext();
    // This does a bare minimum so this object could be created in advance, or whenever convenient.
    midiBuffer = new ABCJS.synth.CreateSynth();
  });

  function load(event) {
    // Cribbed from the basicSynth example in https://paulrosen.github.io/abcjs/audio/synthesized-sound.html

    event.preventDefault(); // Since we're using this as a load handler from the form submission
    // First draw the music - this supplies an object that has a lot of information about how to create the synth.
    // NOTE: If you want just the sound without showing the music, use "*" instead of "paper" in the renderAbc call.

    log("Received the event", event);
    var abc = getHeader() + abcify(event.target[0].value + "%"); // We add the % to work around a bug where the last note was being moved up an octave; unclear if this is our fault or the library's

    var visualObj = ABCJS.renderAbc("paper", abc, {
      responsive: "resize",
    })[0];

    var stopAudioButton = document.querySelector(".stop-audio");
    var statusDiv = document.querySelector(".status");

    if (midiBuffer) midiBuffer.stop();

    log("Testing browser…");
    if (ABCJS.synth.supportsAudio()) {
      stopAudioButton.setAttribute(
        "style",
        "height:1.5em;font-size:2em;background-color:#fff;border:none;transform:translateY(3px);"
      );

      // An audio context is needed - this can be passed in for two reasons:
      // 1) So that you can share this audio context with other elements on your page.
      // 2) So that you can create it during a user interaction so that the browser doesn't block the sound.
      // Setting this is optional - if you don't set an audioContext, then abcjs will create one.

      audioContext.resume().then(function () {
        log("Resumed the AudioContext…");
        // In theory the AC shouldn't start suspended because it is being initialized in a click handler, but iOS seems to anyway.

        // midiBuffer.init preloads and caches all the notes needed. There may be significant network traffic here.
        return midiBuffer
          .init({
            visualObj: visualObj,
            audioContext: audioContext,
            millisecondsPerMeasure: visualObj.millisecondsPerMeasure(),
          })
          .then(function (response) {
            log("Currently have the render object", visualObj);
            log("Now loaded the notes", response);
            log("Audio object has been initialized");
            return midiBuffer.prime();
          })
          .then(function (response) {
            log("Audio object has been primed", response.duration, "seconds");
            log("Current status is", response.status);
            // At this point, everything slow has happened. midiBuffer.start will return very quickly and will start playing very quickly without lag.
            midiBuffer.start();
            log("Now the audio has started…");
            return Promise.resolve();
          })
          .catch((error) => console.error("Synth error", error));
      });
    } else {
      var audioError = document.querySelector(".audio-error");
      audioError.setAttribute("style", "");
    }

    stopAudioButton.addEventListener("click", function () {
      if (midiBuffer) midiBuffer.stop();
    });
  }

  return (
    <div className="container">
      <div
        className="controls"
        style={{ display: "flex", alignItems: "center", paddingLeft: "16px" }}
      >
        <form id="secret" onSubmit={load}>
          <input
            type="text"
            placeholder="Your Secret…"
            style={{ height: "1.5em", fontSize: "1.6em" }}
          />
          <input
            type="submit"
            value="▶️"
            style={{
              height: "1.5em",
              fontSize: "2em",
              backgroundColor: "#fff",
              border: "none",
              transform: "translateY(3px)",
              paddingLeft: "12px",
            }}
          />
        </form>
        <div id="translated-abc"></div>
        <div className="row">
          <div>
            <button
              className="stop-audio"
              style={{
                height: "1.5em",
                fontSize: "2em",
                backgroundColor: "#fff",
                border: "none",
                transform: "translateY(3px)",
              }}
            >
              ⏹
            </button>
            <div className="audio-error" style={{ display: "none" }}>
              Audio is not supported in this browser.
            </div>
          </div>
          <div className="status"></div>
        </div>
      </div>
      <div id="paper"></div>
      {/*      <p className="suspend-explanation">
        Browsers won't allow audio to work unless the audio is started in
        response to a user action. This prevents auto-playing web sites.
        Therefore, the following button is needed to do the initialization:
      </p>*/}
    </div>
  );
}
