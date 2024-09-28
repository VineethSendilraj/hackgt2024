
<p align="center">
  <img src="https://github.com/VineethSendilraj/hackgt2024/blob/main/logo-removebg-preview.png", width="300"/>
</p>

# safely

travel **safely** with advanced crime visualization and pathfinding

## Table of Contents 🧾
* [Why safely](#why-safely)
* [How it Works](#how-it-works-)
* [Challenges](#challenges-)
* [How can we improve?](#how-can-we-improve-)
* [License](#License)

## Why safely❓

In a city grappling with high crime rates, safely empowers residents by transforming how they understand their surroundings. We're providing peace of mind, enabling users to generate safer paths and navigate Atlanta confidently.

## How it works 💻

safely automatically clusters historical crime data in Atlanta with data provided by the Atlanta police department. It runs on the MapBox API (used by BMW, Rivian, Toyota) which provides seamless and responsive frontend interaction. Users are able to filter based on crimes, and also generate directions that avoid high crime areas.

The front end is built with React.js and styled using Chakra UI components. A custom pathfinding algorithm integrates with the Mapbox Directions API to guide users along safer routes, dynamically bypassing high-crime clusters. The geojson data is parsed and loaded as a layer on top of the MapBox visualization.

## Challenges 👎

One of the most significant challenges we faced was the Mapbox Directions API's limitation, which allows avoidance of only up to 50 points per request. Given Atlanta's high crime density, this posed a serious obstacle to creating genuinely safe paths for our users. To overcome this, we needed to develop a sophisticated approach that adapts to different modes of transportation.

For driving, we adopted a broader clustering method, allowing for more general avoidance of high-crime areas since vehicles can cover greater distances quickly. For walking and biking, the challenge was even greater due to the need for more precise route adjustments—walking and biking users are more vulnerable and can’t bypass large areas as quickly. This required us to implement a dynamic filtering system that intelligently prioritizes the most dangerous clusters, ensuring that even within the API’s limitations, users can navigate safely.

## How can we Improve? 🤔

Deploying safely as a mobile app would unlock real-time user location tracking, enabling seamless, on-the-go navigation and safer route adjustments based on dynamic user movement.

Additionally, while the current Atlanta PD website lacks direct access to live GeoJSON data, implementing a web scraping algorithm would allow Safely to stay updated with the latest crime reports. By continuously extracting and integrating this data, we could ensure that our crime clusters and safety recommendations remain accurate and up-to-date, providing users with the most reliable information possible.

## License 📜

Copyright 2024 ©Vineeth Sendilraj, Vatsal Dwivedi, Frank Chang

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.