import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import abcjs from "abcjs"

import { useEffect } from 'react'


export default function Home() {
  let abcPlaceholder = "X:1\nK:D\nDDAA|BBA2|\n";
  let translateAndRender = function(event) {
    event.preventDefault();
    document.querySelector("#translated-abc").innerText = abcPlaceholder;
    abcjs.renderAbc("paper", abcPlaceholder)
  }
  return (
    <>
    <form id='secret' onSubmit={translateAndRender}>
    <input type='text' placeholder="Your Secret…"/>
    <input type="submit" value="Submit"/>
    </form>
    <div id='translated-abc'></div>
    <div id="paper"></div>
    </>
  )
}
