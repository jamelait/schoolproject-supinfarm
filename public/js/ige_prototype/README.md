#The Isogenic Game Engine - Prototype Version

This repository contains the latest build of the Isogenic Game Engine (IGE) prototype version 1.1.0. The prototype version is free to use and is made available for you to be able to evaluate the IGE before you decide to purchase a license.

## Examples

The "examples" folder contains most of the examples that are included with the full version of the IGE. Load an example's index.html to see it working. Some of the examples require being run from a web server such as apache as they make use of XHR.

## FYI
The prototype version of the engine is built from many (but not all) of the classes that the full version contains. Notable exceptions are some of the 3d physics and all networking classes. Since the engine has been packaged into a single file (./engine/core/ige.js) it contains many classes that you might not use in your game. The ige.js file weighs in at just over 400kb but when using the full version of the engine it includes a packaging system that automatically removes unused classes from the final deployment of your project.

This makes the prototype version great for development and testing but less awesome for production deployment since every byte counts. If you are going to deploy your game for production use please purchase a license so that you can properly package your game and it's dependencies.

## Differences Between Prototype and Full Commercial Version
The commercial version includes some extra functionality / features:

* Networking features (full server-side simulation with client-side sync and interpolation)
* Server-side (Node.js) support
* License allows commercial use
* Full unobfuscated, commented source code to fork and edit for your needs
* Access to related in-development projects such as the GUI editor (currently still in early / alpha stage development) on request

The commercial license starts at just £60 GBP (roughly $99 USD) and can be found here: http://store.isogenicengine.com

## License

You may use the IGE prototype for non-commercial, educational or hobbyist purposes only. If you wish to create a game that utilises the IGE and generates income from any source connected to the game via online means (this includes in-game purchases, banner adverts in the game or on the page the game runs on, bank transfers that were originated offline but were meant for in-game purchases etc) then you need to purchase a license for the engine. Examples of income that is not counted as requiring a license are t-shirts featuring the game or game art, accessories or other real-world items that are not part of the "digital" game etc. You can purchase a license from our website listed below.

## Questions? Issues? Bugs?
If you have any comments, questions, requests, issues or bug reports please use the GitHub issue tracker for this repository: https://github.com/coolbloke1324/ige_prototype/issues

## Phone Home
The Isogenic Game Engine website can be found here: http://www.isogenicengine.com

