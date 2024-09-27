from flask import Flask, render_template, request, redirect, session, url_for, json, flash
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'alkshdfklhasdiohf'

@app.route("/map", methods=["POST", "GET"])
def map():
    return render_template("map.html")

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0")




