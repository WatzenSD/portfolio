import { Component, signal, AfterViewInit } from '@angular/core';
import LegendaryCursor from "legendary-cursor";
import * as THREE from "three";

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements AfterViewInit {
  protected readonly title = signal("Portfolio");

  ngAfterViewInit() {
  }
}

// Cursor
window.addEventListener("load", () => {
  LegendaryCursor.init({
    lineSize:         0.035,
    opacityDecrement: 0.9,
    speedExpFactor:   0.3,
    lineExpFactor:    0.125,
    sparklesCount:    75,
    maxOpacity:       0.9,
    texture1: "./cursor/wind-galaxy.jpg",
    texture2: "./cursor/dark-galaxy.jpg",
    texture3: "./cursor/matrix-blob.png",
  });
});