"use strict";
// Created from Globals.swift
//  8/17/2020   Created/Copied

//Singleton class for globally managing detail output
var Output = {
    _isEnabled : false,
    _output : "",

    add : function(...strings) {
      this._output += strings.join('');
    },

    initialize : function() {
      this._output = "";
      this._isEnabled = true;
    },

    get : function() {
      return this.output;
    }


}
