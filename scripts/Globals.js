"use strict";
// Created from Globals.swift
//  8/17/2020   Created/Copied

//Singleton class for globally managing detail output
export const Output =  {
    _isEnabled : false,
    _output : "",

    add(...strings) {
      this._output += strings.join('');
    },

    initialize() {
      this._output = "";
      this._isEnabled = true;
    },

    get output() {
      return this._output;
    }
}
