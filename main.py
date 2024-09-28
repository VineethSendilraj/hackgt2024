from flask import Flask, render_template, request, redirect, session, url_for, json, flash
import os
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = 'alkshdfklhasdiohf'

@app.route("/map", methods=["POST", "GET"])
def map():
    return render_template("map.html")

@app.route('/time')
def get_current_time():
    return {'time': time.time()}

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0")




