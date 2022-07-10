import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import ABCJS from "abcjs";

import { useEffect } from "react";

function characterToABC(char) {
  if (char.length == 1) {
      let regexToABC = {};
  let characterList = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","-.!–—,…?:;"];
  let regexList = characterList.map(c => new RegExp(`[${c}]`,"i"));
  let skipRegex = characterList;
  skipRegex = `[^${skipRegex.reverse().join('')}]`;
  regexList.push(new RegExp(`[^${characterList.join('')}]`,"i"))
  let abcList = ["a","^a","b","c'","^c'","d'","^d'","e'","f'","^f'","g'","^g'","a'","A","^A","B","c","^c","d","^d","e","f","^f","g","^g","A","z"];
  return abcList[regexList.findIndex((r) => r.test(char))];
  }
  else {
    console.log("`characterToABC expects one character, received", char.length);
    return false;
  }
}

function abcify(string) {
  return string.split('').map(characterToABC);
}

function getTimeSignature() {
  let timeSignatures = ["4/4","3/4","6/8","7/8"].map(sig => {
    let [beatsPerMeasure, beatNoteLength] = sig.split("/").map(c => parseInt(c));
    return {beatsPerMeasure:beatsPerMeasure, beatNoteLength:beatNoteLength}
  });
  return timeSignatures[Math.floor(Math.random()*timeSignatures.length)];
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
  console.log(`${timeSignature.beatsPerMeasure}/${timeSignature.beatNoteLength}`)
  return [
  `T: ${"Title"}`,
  `M: ${timeSignature.beatsPerMeasure}/${timeSignature.beatNoteLength}`,
  `L: 1/8`,
  `K: ${getKey()}`,
  `[I:MIDI= program ${saxophoneMIDIindices["alto_sax"]} ]`,
  ].join('\n')
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

  useEffect(() => {
    let secretInput = document.querySelector("#secret input[type='text']");
  secretInput.value = "abcdefghijklmnopqrstuvwxyz";
  })

 function load(event) {
    // Cribbed from the basicSynth example in https://paulrosen.github.io/abcjs/audio/synthesized-sound.html

    event.preventDefault(); // Since we're using this as a load handler from the form submission
    // First draw the music - this supplies an object that has a lot of information about how to create the synth.
    // NOTE: If you want just the sound without showing the music, use "*" instead of "paper" in the renderAbc call.

    console.log(event);
    var abc =getHeader() + abcify(event.target[0].value)

    var visualObj = ABCJS.renderAbc("paper", abc, {
      responsive: "resize",
    })[0];

    // This object is the class that will contain the buffer
    var midiBuffer;

    var startAudioButton = document.querySelector(".activate-audio");
    var stopAudioButton = document.querySelector(".stop-audio");
    var explanationDiv = document.querySelector(".suspend-explanation");
    var statusDiv = document.querySelector(".status");

    startAudioButton.addEventListener("click", function () {
      startAudioButton.setAttribute("style", "display:none;");
      explanationDiv.setAttribute("style", "opacity: 0;");
      statusDiv.innerHTML = "<div>Testing browser</div>";
      if (ABCJS.synth.supportsAudio()) {
        stopAudioButton.setAttribute("style", "");

        // An audio context is needed - this can be passed in for two reasons:
        // 1) So that you can share this audio context with other elements on your page.
        // 2) So that you can create it during a user interaction so that the browser doesn't block the sound.
        // Setting this is optional - if you don't set an audioContext, then abcjs will create one.
        window.AudioContext =
          window.AudioContext ||
          window.webkitAudioContext ||
          navigator.mozAudioContext ||
          navigator.msAudioContext;

        var audioContext = new window.AudioContext();
        audioContext.resume().then(function () {
          statusDiv.innerHTML += "<div>AudioContext resumed</div>";
          // In theory the AC shouldn't start suspended because it is being initialized in a click handler, but iOS seems to anyway.

          // This does a bare minimum so this object could be created in advance, or whenever convenient.
          midiBuffer = new ABCJS.synth.CreateSynth();

          // midiBuffer.init preloads and caches all the notes needed. There may be significant network traffic here.
          return midiBuffer
            .init({
              visualObj: visualObj,
              audioContext: audioContext,
              millisecondsPerMeasure: visualObj.millisecondsPerMeasure(),
            })
            .then(function (response) {
              console.log(visualObj);
              console.log("Notes loaded: ", response);
              statusDiv.innerHTML +=
                "<div>Audio object has been initialized</div>";
              // console.log(response); // this contains the list of notes that were loaded.
              // midiBuffer.prime actually builds the output buffer.
              return midiBuffer.prime();
            })
            .then(function (response) {
              statusDiv.innerHTML +=
                "<div>Audio object has been primed (" +
                response.duration +
                " seconds).</div>";
              statusDiv.innerHTML +=
                "<div>status = " + response.status + "</div>";
              // At this point, everything slow has happened. midiBuffer.start will return very quickly and will start playing very quickly without lag.
              midiBuffer.start();
              statusDiv.innerHTML += "<div>Audio started</div>";
              return Promise.resolve();
            })
            .catch(function (error) {
              if (error.status === "NotSupported") {
                stopAudioButton.setAttribute("style", "display:none;");
                var audioError = document.querySelector(".audio-error");
                audioError.setAttribute("style", "");
              } else console.warn("synth error", error);
            });
        });
      } else {
        var audioError = document.querySelector(".audio-error");
        audioError.setAttribute("style", "");
      }
    });

    stopAudioButton.addEventListener("click", function () {
      startAudioButton.setAttribute("style", "");
      explanationDiv.setAttribute("style", "");
      stopAudioButton.setAttribute("style", "display:none;");
      if (midiBuffer) midiBuffer.stop();
    });
  }

  return (
    <div className="container">
      <form id="secret" onSubmit={load}>
        <input type="text" placeholder="Your Secret…" />
        <input type="submit" value="Submit" />
      </form>
      <div id="translated-abc"></div>
      <div className="row">
        <div>
          <button className="activate-audio">
            Activate Audio Context And Play
          </button>
          <button className="stop-audio" style={{ display: "none" }}>
            Stop Audio
          </button>
          <div className="audio-error" style={{ display: "none" }}>
            Audio is not supported in this browser.
          </div>
        </div>
        <div className="status"></div>
      </div>
      <div id="paper"></div>
      <p className="suspend-explanation">
        Browsers won't allow audio to work unless the audio is started in
        response to a user action. This prevents auto-playing web sites.
        Therefore, the following button is needed to do the initialization:
      </p>
    </div>
  );
}
