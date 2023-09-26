function(instance, properties, context) {
if (instance.data.app && instance.data.app.renderer && instance.data.visible) {
  // Get the account web page ID and label to highlight from properties
  instance.data.accountWebPageID = properties.account_webpage?.get(`_id`);
  instance.data.proxyVariables.labelToHighlight = properties.label_to_highlight?.get(`_id`);
  instance.data.displayLabelText = properties.display_label_text;
  //add read only property
  instance.data.readOnly = properties.readonly;

  // Local variable for the PIXI main container that makes it easier to type
  const mainContainer = instance.data.mainContainer;

  // Get the key lists for the drawn attribute snippets and attributes, and log them to the console
  const keyListDAS = properties.drawn_attribute_snippets.get(0, properties.drawn_attribute_snippets.length())[0]?.listProperties();
  const keyListAtt = properties.attributes.get(0, properties.attributes.length())[0]?.listProperties();

  // Get the label data from properties and store it in local variables
  let labelsOrigin = properties.attributes.get(0, properties.attributes.length());
  let labels = labelsOrigin;

  // Get the label colors from properties, if available
  const labelColors = properties.attribute_colors?.get(0, properties.attribute_colors.length());

  // Store other properties in instance data variables for use in other functions and conditional statements in update
  instance.data.webpageScreenshot = properties.webpage_screenshot;
  instance.data.labelFont = properties.font;
  instance.data.labelFontSize = properties.font_size;
  instance.data.labelFontColor = properties.labelFontColor;
  instance.data.dasOrigin = properties.drawn_attribute_snippets.get(0, properties.drawn_attribute_snippets.length());
  instance.data.highlightColor = properties.highlight_color; // yellow
  instance.data.highlightColorAlpha = properties.highlight_color_alpha;
  instance.data.normalColorAlpha = properties.normal_color_alpha;
  instance.data.dragColor = properties.drag_color; // red
  instance.data.resizeColor = properties.resize_color;

  // Loop through the drawn attribute snippets and set the label attributes
  let drawnAttributeSnippets = instance.data.dasOrigin;
  drawnAttributeSnippets.forEach((das, index) => {
      das.labelUniqueID = das.get('attribute');
      if (labels[index] && labelColors?.[index]) {
          das.attributeName = labels[index].get('name_text');
          das.attributeId = labels[index].get('_id');
          das.labelColor = labelColors[index].slice(1);
      }
  });

if (instance.data.start && instance.data.app && instance.data.app.renderer) {


    
      //generate the base div for pixi to live in
      instance.canvas.insertAdjacentHTML("beforeend",
          `<div id=${instance.data.randomElementID} class="pixi-container"></div>`);

      ele = document.getElementById(instance.data.randomElementID);
      instance.data.ele = ele;
      //add the pixi app to the div
      ele.appendChild(instance.data.app.view);


      //start setting up pixi and the main container
      instance.data.mainContainer = new PIXI.Container();
      //redundent but allows us to work with the instanced mainContainer variable by using mainContainer
      instance.data.mainContainer = mainContainer;
      instance.data.app.stage.addChild(mainContainer);

      instance.data.start = false;
      
  }

  //if we're provided a screenshot, load it or reload it if the width of the canvas has changed because Bubble runs update on resize
  if (properties.webpage_screenshot) {

      //load the webpage and rects with a delay, because Bubble doesn't load the container at the same time this is visible. This covers the case where the Bubble element changes webpages. We need to wait for the element to become visisble entirely before we can reload the screenshot.
      setTimeout(() => {
          instance.data.screenshot = PIXI.Texture.fromURL(
              `${instance.data.imgixBaseURL}/${properties.webpage_screenshot}?w=${1000}`
          ).then((texture) => {
              //remove all shapes drawn before so we can redraw them
              mainContainer.removeChildren()
              texture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;

              //create a sprite from the webpage screenshot
              instance.data.webpageSprite = PIXI.Sprite.from(texture);
              webpageSprite = instance.data.webpageSprite;
              webpageSprite.cullable = true;

              //get the initial width and height of the webpage at the current width of the element. This is stored so we can resize locally
              instance.data.intialWebpageWidth = webpageSprite.width;
              instance.data.intialWebpageHeight = webpageSprite.height;
              webpageSprite.name = "webpage";
              webpageSprite.scale.set(instance.data.app.view.width / webpageSprite.width);

              mainContainer.addChild(webpageSprite);
              mainContainer.interactive = true;

              //add the intial event listeners that are on the main container. These work even after the Bubble element swaps in new content.
              if (!instance.data.addedMainContainerEventListeners && !instance.data.readOnly) {
                  mainContainer.on('pointerdown', (e) => {
                      //makes sure it's left click
                      if (e.data.button === 0) {
                          if (instance.data.proxyVariables.inputMode == instance.data.InputModeEnum.create) {
                              instance.data.startPosition = new PIXI.Point().copyFrom(e.global)

                              //clear the selected rectangle because we clicked on nothing and we're drawing a new rectangle. This also publishes the state of the selected rectangle.
                              instance.data.proxyVariables.selectedRectangle = null;
                          }

                          if (instance.data.inputMode == instance.data.InputModeEnum.select) {
                              instance.data.selectRect(e.target);
                          }
                      }
                  });

                  mainContainer.addEventListener('pointermove', (e) => {

                      //if we're in create mode, make sure the cursor is updated, because it doesn't seem to update until the mouse has moved
                      if (instance.data.proxyVariables.inputMode == instance.data.InputModeEnum.create && mainContainer.cursor !== "crosshair") {
                          mainContainer.cursor = "crosshair";
                      }

                      // Do this routine only if in create mode and have started creation
                      // this event triggers all the time but we stop it by not providing start postition when cursor not pressed
                      if (instance.data.inputMode == instance.data.InputModeEnum.create && instance.data.startPosition && instance.data.proxyVariables.rectangleBeingMoved == null && instance.data.proxyVariables.rectangleBeingResized == null) {
                          // disable all other interactions on the main container so we don't lose control moving over another rectangle. Maybe don't need to run this every time?
                          instance.data.mainContainer.children.forEach(child => {
                              if (child.name !== "webpage") {
                                  if (child.interactive) {
                                      child.interactive = false;
                                  }
                              }
                          })

                          // get new global position from event
                          let currentPosition = e.global;
                          let {
                              start,
                              size
                          } = instance.data.getStartAndSize(currentPosition, instance.data.startPosition, "draw")

                          // if the size is greater than 5x5, draw the rectangle
                          if (size.x > 5 && size.y > 5) {
                              if (!instance.data.currentRectangle) {
                                  instance.data.currentRectangle = new PIXI.Graphics().beginFill("0x" + instance.data.highlightColor, instance.data.highlightColorAlpha)
                                      .lineStyle({
                                          color: "0x" + instance.data.highlightColor,
                                          alpha: 0.5,
                                          width: 1
                                      }).drawRect(0, 0, size.x, size.y).endFill()
                                  instance.data.currentRectangle.labelColor = instance.data.highlightColor;
                                  instance.data.currentRectangle.oldColor = instance.data.highlightColor;
                                  instance.data.currentRectangle.name = "";
                                  instance.data.currentRectangle.intialScale = instance.data.app.view.width / instance.data.intialWebpageWidth;

                                  instance.data.currentRectangle.position.copyFrom(start)
                                  instance.data.addLabel(instance.data.currentRectangle);
                                  mainContainer.addChild(instance.data.currentRectangle)
                              } else {
                                  //if we already have a rectangle, scale it instead of creating it
                                  instance.data.resizeNewRectangle(instance.data.currentRectangle, currentPosition)
                              }
                          } else {
                              if (instance.data.currentRectangle) {
                                  mainContainer.removeChild(instance.data.currentRectangle);
                                  instance.data.currentRectangle = null
                              }
                          }
                      }
                      if (instance.data.proxyVariables.rectangleBeingMoved) {

                          const mouseX = e.global.x - instance.data.mainContainer.x;
                          const mouseY = e.global.y - instance.data.mainContainer.y;
                          instance.data.proxyVariables.rectangleBeingMoved.position.set(
                              mouseX - instance.data.proxyVariables.rectangleBeingMoved.relativeMouseX,
                              mouseY - instance.data.proxyVariables.rectangleBeingMoved.relativeMouseY
                          );

                      }
                      if (instance.data.proxyVariables.rectangleBeingResized) {


                          //just grab the rectangle we're resizing for shorter syntax
                          const resizingRectangle = instance.data.proxyVariables.rectangleBeingResized;
                          const mouseX = e.global.x - instance.data.mainContainer.x;
                          const mouseY = e.global.y - instance.data.mainContainer.y;
                          //calculate the new size based on mouse position and starting position
                          let newWidth =
                              mouseX - resizingRectangle.startMouseX + resizingRectangle.originalResizeWidth;
                          let newHeight =
                              mouseY - resizingRectangle.startMouseY + resizingRectangle.originalResizeHeight;




                          resizingRectangle
                              .clear()
                              .beginFill("0x" + instance.data.highlightColor, instance.data.highlightColorAlpha)
                              .lineStyle({
                                  color: 0x000000,
                                  alpha: 1,
                                  width: 1,
                              })
                              .drawRect(0, 0, newWidth, newHeight)
                              .endFill();

                      }
                  }, { passive: true });
                  mainContainer.addEventListener('pointerup', (e) => {

                      // Wrap up rect creation
                      instance.data.startPosition = null
                      if (instance.data.currentRectangle && instance.data.currentRectangle.interactive == false) {
                          instance.data.currentRectangle.interactive = true;
                          instance.data.currentRectangle
                              // Mouse & touch events are normalized into
                              // the pointer* events for handling different
                              // Rectangle events.
                              .on('pointerover', instance.data.onRectangleOver)

                          instance.data.currentRectangle.initialScale = instance.data.app.view.width / instance.data.intialWebpageWidth;



                          let rectData = [
                              instance.data.currentRectangle.x.toString(),
                              instance.data.currentRectangle.y.toString(),
                              instance.data.currentRectangle.width.toString(),
                              instance.data.currentRectangle.height.toString(),
                              instance.data.currentRectangle.name,
                              instance.data.currentRectangle.labelColor.toString(),
                              instance.data.currentRectangle.oldColor.toString(),
                              instance.data.currentRectangle.initialScale.toString()
                          ]




                          //create the data directly via the API
                          let headersList = {
                              "Accept": "*/*",
                          }
                          let bodyContent = new FormData();
                          bodyContent.append("x", rectData[0]);
                          bodyContent.append("y", rectData[1]);
                          bodyContent.append("width", rectData[2]);
                          bodyContent.append("height", rectData[3]);
                          bodyContent.append("initial_drawn_scale", rectData[7]);
                          bodyContent.append("account_webpage", instance.data.accountWebPageID);

                          fetch(`https://app.syllabus.io/${instance.data.dynamicFetchParam}api/1.1/wf/create-new-drawn-label`, {
                              method: "POST",
                              body: bodyContent,
                              headers: headersList
                          }).then(response => response.json())
                              .then(result => {
                                  let newID = result.response.drawn_attribute_snippet._id;



                                  instance.publishState(`recently_created_drawing_data`, rectData)
                                  instance.publishState(`recently_created_drawn_label`, newID)
                                  setTimeout(() => {
                                      instance.triggerEvent(`drawn_label_created`)

                                  }, 200)

                              })



                      }
                      instance.data.currentRectangle = null

                      if (instance.data.rectangleBeingResized) {
                          //update the shape in the database




                          instance.data.rectangleBeingResized = null;
                          instance.data.proxyVariables.rectangleBeingResized = null;
                          instance.data.rectangleBeingMoved = null;
                          instance.data.proxyVariables.rectangleBeingMoved = null;

                      }

                      if (instance.data.proxyVariables?.rectangleBeingMoved) {



                          let headersList = {
                              "Accept": "*/*",
                          }
                          let drawnScale = instance.data.app.view.width / instance.data.intialWebpageWidth;

                          let bodyContent = new FormData();
                          bodyContent.append("x", instance.data.rectangleBeingMoved.position.x);
                          bodyContent.append("y", instance.data.rectangleBeingMoved.position.y);
                          bodyContent.append("width", instance.data.rectangleBeingMoved.width);
                          bodyContent.append("height", instance.data.rectangleBeingMoved.height);
                          bodyContent.append("initial_drawn_scale", drawnScale)
                          bodyContent.append("drawn_label_snippet", instance.data.rectangleBeingMoved.id);

                          fetch(`https://app.syllabus.io/${instance.data.dynamicFetchParam}api/1.1/wf/update-drawn-label`, {
                              method: "POST",
                              body: bodyContent,
                              headers: headersList
                          }).then(response => response.json())
                              .then(result => {
                                  let newID = result.response.drawn_attribute_snippet._id;
                              })


                          instance.data.rectangleBeingMoved = null;
                      }
                      instance.data.proxyVariables.rectangleBeingMoved = null;
                      instance.data.rectangleBeingResized = null;
                      instance.data.proxyVariables.rectangleBeingResized = null;


                  }, { passive: true });

                  mainContainer.addEventListener("pointermove", e => {

                      //set the input mode to create if we're not in create mode and the container is moved over. This should probably be moved into the other pointermove event listener
                      if (instance.data.proxyVariables.inputMode !== instance.data.InputModeEnum.create && !instance.data.proxyVariables.rectangleBeingMoved) {
                          instance.data.proxyVariables.inputMode = instance.data.InputModeEnum.create
                          instance.data.inputMode = instance.data.InputModeEnum.create
                          mainContainer.cursor = "crosshair"

                      }
                  }, { passive: true })

                  instance.data.addedMainContainerEventListeners = true;
              }
              //this officially loads the drawn attribute snippet. It's a ternary because we wanted to toggle it on/off for testing
              instance.data.loadData ? instance.data.loadDAS(instance.data.dasOrigin) : null;


              //destroy and recreate the scroll bar if it exists. Just create it normally otherwise. Create the necessary event listeners
              if (instance.data.scrollBar) {
                  instance.data.scrollBar.destroy();
              }
              instance.data.scrollBar = instance.data.createScrollBar(instance.data.mainContainer, instance.data.app, instance.data.ele);
              instance.data.ele.addEventListener("wheel", instance.data.scrollCanvas, { passive: true })
              window.addEventListener("pointermove", instance.data.scrollBarWindowPointerMove, { passive: true })

          });
      }, 200)
  }
instance.publishState(`ready`, true)
}
}