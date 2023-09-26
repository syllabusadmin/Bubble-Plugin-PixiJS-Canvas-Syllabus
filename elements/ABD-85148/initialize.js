function(instance, context) {
    //intialize instance variables
    instance.data.start = true;
    instance.data.logging = true;
    instance.data.loadData = true;
    instance.data.randomElementID = `pixi-${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}`
    instance.data.webpageScreenshot;
    instance.data.labelFont = "Inter";
    instance.data.labelFontSize = "20";
    instance.data.labelFontColor = "000000";
    instance.data.normalColorAlpha = ".3";
    instance.data.highlightColorAlpha = .3;
    instance.data.dasOrigin;
    instance.data.addedMainContainerEventListeners = false;
    instance.data.maxScroll = .1;
    instance.data.scrollBarLastY;
    instance.data.scrollBarLastTop;
    instance.data.scrollPositionBefore = 0;
    instance.data.accountWebPageID;
    instance.data.rectangleBeingResized; //to be replaced by proxy
    instance.data.rectangleBeingMoved; //to be replaced by proxy
    instance.data.screenshot;
    instance.data.imgixBaseURL = `https://d1muf25xaso8hp.cloudfront.net/`;
    instance.data.dynamicFetchParam;
    instance.data.webpageSprite;
    instance.data.scrollBar;
    instance.data.intialWebpageWidth;
    instance.data.intialWebpageHeight;
    instance.data.resizeTimeout = null;
    instance.data.ele;   //main element that holds pixi
    instance.data.app = new PIXI.Application({
        resizeTo: instance.canvas,
        backgroundColor: 0x000000,
        backgroundAlpha: 0,
    });
    PIXI.settings.ROUND_PIXELS = true;

    instance.data.mainContainer = new PIXI.Container();
    instance.data.mainContainer.name = "mainContainer";
    instance.data.app.stage.addChild(instance.data.mainContainer);
    instance.data.dragColor = "DE3249"; //red default
    instance.data.highlightColor = "FFFF00"; //yellow
    instance.data.resizeColor = "FFFF00"; //"0000FF"; //blue
    instance.data.displayLabelText;
    // Start position of events
    instance.data.startPosition = null;
    // Current edited or created rectangle
    instance.data.currentRectangle = null;
    //added for action based options with rectangles (scrollTo)
    instance.data.rectangles = [];
    instance.data.readOnly = true;
    //adds ready state
    instance.publishState(`ready`, false)


    //input modes for handling the current mode the user is in
    instance.data.InputModeEnum = {
        create: 1,
        select: 2,
        scale: 3,
        move: 4,
    };
    // Set mode for whole input (by default we create rectangles)
    instance.data.inputMode = instance.data.InputModeEnum.create;

    //a proxy variable is just a variable that allows us to hook into the set function or get function. So when the value of any of these variables change, we can run some code. In our case, highlight/unhighlight shapes. Change the cursor, etc. The idea is that we can use this to trigger events when the value of the variable changes.
    instance.data.proxyVariables = new Proxy({
        selectedRectangle: null,
        inputMode: instance.data.InputModeEnum.create,
        rectangleBeingResized: null,
        rectangleBeingMoved: null,
        labelToHighlight: null,

    }, {
        set: function (obj, prop, value) {
            let previousValue = obj[prop];
            (`proxy previous value:`, prop, previousValue);
            ;

            //check if the property is the selected rectangle
            if (prop === `selectedRectangle`) {
                console.log('CSP rect prop selected', value, prop);
                //check if the value is not null and the value is not the same as the previous value
                if (value && value !== previousValue) {
                    //loop through all of the containers on the main container (the squares)
                    instance.publishState("currently_selected_drawing", value.id)
                    setTimeout(() => {
                        instance.triggerEvent("label_selected")
                    }, 100)
                    //this was the original code that was used to highlight the rectangles locally. We're not using this anymore, but I'm leaving it here for reference. It still works I just ran out of time to implement it.
                    instance.data.mainContainer.children.forEach((child) => {
                        if (child.name !== "webpage") {
                            //check if the current rectangle selected has the same labelUniqueID as the child we're looping through
                            // if (child.labelUniqueID === value.labelUniqueID) {
                            //     //if it does, we set the child to be highlighted and selected
                            //     child.isHighlighted = true;
                            //     //calculate the width and height of the rectangle including the border
                            //     let borderWidth = child.line.width;
                            //     let height = child.height - borderWidth;
                            //     let width = child.width - borderWidth;
                            //     //the rectangle is highlighted - so it becomes movable
                            //     child.cursor = "move";



                            //     //clear the drawing, and redraw the square with the highlight color
                            //     child.clear();
                            //     child.beginFill(instance.data.highlightColorAsHex, instance.data.highlightColorAlpha);
                            //     child.lineStyle(1, 0x000000, 1);

                            //     //we minus 1 to account for the border. Theres a slight increase
                            //     child.drawRect(0, 0, width, height);
                            //     child.endFill();
                            //     child.isHighlighted = true;
                            // }
                            if (child.labelUniqueID !== value.labelUniqueID && child.isHighlighted) {
                                child.isHighlighted = false;
                                child.isSelected = false;
                                child.cursor = "pointer";
                                let height = child.height - 1;
                                let width = child.width - 1;
                                let color = `0x` + child.labelColor;
                                child
                                    .clear()
                                    .beginFill(color, instance.data.normalColorAlpha)
                                    .drawRect(0, 0, width, height)
                                    .endFill()
                                    .beginHole()
                                    .drawRect(5, 5, width - 10, height - 10)
                                    .endHole();
                            }
                        }
                    });
                    value.isSelected = true;

                    //set the value of the property to the new value
                    obj[prop] = value;
                }
                //check if the selected shape is null and the previous value is not null
                // these runs our `deselect` function essentially
                //it also prevents this from running if we're changing the value from null to null
                else if (!value && previousValue) {
                    instance.publishState("currently_selected_drawing", null)
                    instance.data.mainContainer.children.forEach((child) => {
                        if (child.name !== "webpage" && child.isHighlighted) {
                            child.isSelected = false;
                            child.isHighlighted = false;
                            child.cursor = "pointer";
                            let height = child.height - 1;
                            let width = child.width - 1;
                            let color = `0x` + child.labelColor;
                            child
                                .clear()
                                .beginFill(color, instance.data.normalColorAlpha)
                                .drawRect(0, 0, width, height)
                                .endFill()
                                .beginHole()
                                .drawRect(5, 5, width - 10, height - 10)
                                .endHole();

                        }
                    });
                    obj[prop] = value;
                }

            }
            if (prop == "inputMode") {
                //check the current input mode
                for (let property in instance.data.InputModeEnum) {
                    if (instance.data.InputModeEnum[property] == value) {

                    }
                }
                if (value == instance.data.InputModeEnum.create) {
                    instance.data.mainContainer.cursor = "crosshair"
                }
                if (value == instance.data.InputModeEnum.select) {
                    instance.data.mainContainer.children.forEach(child => {
                        child.cursor = "pointer"
                    })
                }
                if (value == instance.data.InputModeEnum.scale) {
                    instance.data.mainContainer.cursor = "nwse-resize"
                }
                if (value == instance.data.InputModeEnum.move) {

                    instance.data.mainContainer.cursor = "move"
                }



            }
            if (prop == "rectangleBeingResized") {
                if (value) {

                }
                else {
                }
            }
            if (prop == "rectangleBeingMoved") {
                if (value) {

                }
                else {
                }
            }
            obj[prop] = value;
        },
        //this is the get function. It's called when we try to access a property on the object
        get: function (obj, prop) {
            return obj[prop];
        }
    });

    //grab the correct version parameter. This allows us to dynamically fetch the correct version we're on, and call the versions backend workflows
    instance.data.dynamicFetchParam = window.location.href;
    instance.data.dynamicFetchParam = instance.data.dynamicFetchParam.split('/');
    instance.data.dynamicFetchParam = instance.data.dynamicFetchParam[3] + `/ `;
    instance.data.dynamicFetchParam = instance.data.dynamicFetchParam.includes("version") ? instance.data.dynamicFetchParam : "";
    instance.data.dynamicFetchParam = instance.data.dynamicFetchParam.trim();

    //functions are all below----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    //creates the pixi scrollbar graphic
    instance.data.createScrollBar = function (mainContainer, pixiApp, div) {
        const scrollPercent = -instance.data.mainContainer.position.y / instance.data.maxScroll;
        ;
        const scrollbarHeight = instance.data.app.view.height * (instance.data.app.view.height / instance.data
            .mainContainer.height);
        const scrollbarY = scrollPercent * (instance.data.app.view.height - scrollbarHeight);
        const scrollBarWidth = 14;
        const scrollbar = new PIXI.Graphics();
        scrollbar.maxScroll = mainContainer.height - pixiApp.view.height;
        instance.data.maxScroll = mainContainer.height - pixiApp.view.height;
        scrollbar.interactive = true;
        scrollbar.beginFill(0x808080);
        scrollbar.drawRect(pixiApp.view.width - scrollBarWidth, scrollbarY, scrollBarWidth, pixiApp.view.height * (
            pixiApp.view.height / mainContainer.height));
        scrollbar.endFill();
        scrollbar.addEventListener("pointerdown", (e) => {
            //check to see if its the left click being press
            if (e.data.button === 0) {
                const scrollPercent = -mainContainer.position.y / scrollbar.maxScroll;
                instance.data.scrollPositionBefore = scrollPercent;
                const scrollbarHeight = pixiApp.view.height * (pixiApp.view.height / mainContainer.height);
                const scrollbarY = scrollPercent * (pixiApp.view.height - scrollbarHeight);
                div.pressed = true;
                scrollbar.lastY = e.data.global.y;
                instance.data.scrollBarLastY = e.client.y;
                instance.data.scrollBarLastTop = scrollbarY;
                scrollbar.tint = 0x808080;
            }
        });
        scrollbar.addEventListener("pointerup", (e) => {
            ;
            div.pressed = false;
            ;
            scrollbar.tint = 0xffffff;
        });
        scrollbar.addEventListener("pointerupoutside", (e) => {
            ;
            div.pressed = false;
            ;
            scrollbar.tint = 0xffffff;
        });
        pixiApp.stage.addChild(scrollbar);

        //New Positioning
        const newPosition = Math.abs(scrollPercent) * (mainContainer.height - pixiApp.view.height);
        if (newPosition) {
            mainContainer.position.y = -newPosition;
        }

        return scrollbar;
    };
    instance.data.scrollCanvas = function (event) {
        document.body.style.overflowY = "hidden";
        let maxScroll = instance.data.mainContainer.height - instance.data.app.view.height;




        // Update the container's y position based on the mouse wheel delta
        instance.data.mainContainer.position.y -= event.deltaY;

        // Clamp the container's position so that it can't scroll past the max scroll value
        if (instance.data.mainContainer.position.y <= instance.data.mainContainer.height) {
            instance.data.mainContainer.position.y = Math.max(
                instance.data.mainContainer.position.y,
                -maxScroll
            );
            instance.data.mainContainer.position.y = Math.min(instance.data.mainContainer.position.y, 0);
        }

        // Update the scrollbar position and size based on the container's scroll position
        const scrollPercent = -instance.data.mainContainer.position.y / maxScroll;
        instance.data.scrollPositionBefore = scrollPercent;
        const scrollbarHeight =
            instance.data.app.view.height * (instance.data.app.view.height / instance.data.mainContainer.height);
        const scrollbarY = scrollPercent * (instance.data.app.view.height - scrollbarHeight);
        if (instance.data.scrollBar?.clear) {
            instance.data.scrollBar.clear();
        }
        instance.data.scrollBar.beginFill(0x808080);
        instance.data.scrollBar.drawRect(
            instance.data.app.view.width - 14,
            scrollbarY,
            14,
            scrollbarHeight
        );
        instance.data.scrollBar.endFill();
        clearTimeout(instance.data.scrollingTimeout);
        instance.data.scrollingTimeout = setTimeout(() => {
            ;
            document.body.style.overflow = "auto";
        }, 1000);
        instance.publishState("scroll_depth", instance.data.mainContainer.position.y)
    }

    //controls the scroll bar when the mouse is moved
    instance.data.scrollBarWindowPointerMove = function (event) {
        if (instance.data.ele.pressed) {
            const scrollPercent = -instance.data.mainContainer.position.y / instance.data.maxScroll;
            instance.data.scrollPositionBefore = scrollPercent;
            ;

            const scrollbarHeight =
                instance.data.app.view.height * (instance.data.app.view.height / instance.data.mainContainer.height);
            const scrollbarY =
                scrollPercent * (instance.data.app.view.height - scrollbarHeight);

            const mouseDif = event.y - instance.data.scrollBarLastY;
            ;

            const newTop = mouseDif + instance.data.scrollBarLastTop;
            const scrollPercent2 = newTop / (instance.data.app.view.height - scrollbarHeight);
            const newScroll = Math.min(-scrollPercent2 * instance.data.maxScroll, 0);

            if (scrollPercent2 > 0 && scrollPercent2 < 1) {
                instance.data.mainContainer.position.y = newScroll;
                instance.data.scrollBar.clear();
                instance.data.scrollBar.beginFill(0x808080);
                instance.data.scrollBar.drawRect(
                    instance.data.app.view.width - 14,
                    newTop,
                    14,
                    scrollbarHeight
                );
                instance.data.scrollBar.endFill();
            }
        }
        instance.publishState("scroll_depth", instance.data.mainContainer.position.y)
    };

    //loads & reformats Drawn Attribute Snippets. This sets the intial shapes on the webpage
    instance.data.loadDAS = function (das) {
        das.forEach((das, index) => {
            //get all of the drawn attribute snippet data
            let startRectX = das.get('x_coordinate_number');
            let startRectY = das.get('y_coordinate_number');
            let width = das.get('box_width_number');
            let height = das.get('box_height_number');
            let intialScale = das.get('initial_drawn_scale_number');
            let dasID = das.get('_id');
            //this is the unique ID of the Attribute
            let dasLabelID = das.attributeId;


            ;
            ;



            let webpageCurrentScale = instance.data.webpageSprite.width / instance.data.intialWebpageWidth;

            let currentScaleFactorWidth = width * webpageCurrentScale / intialScale;
            let currentScaleFactorHeight = height * webpageCurrentScale / intialScale;

            let currentScaleFactorX = startRectX * webpageCurrentScale / intialScale;
            let currentScaleFactorY = startRectY * webpageCurrentScale / intialScale;


            let createCoord = {
                "startRectX": currentScaleFactorX,
                "startRectY": currentScaleFactorY,
                "width": currentScaleFactorWidth,
                "height": currentScaleFactorHeight
            }
            //stop small box creation - Placeholder
            if (createCoord.width < 20) return;
            if (createCoord.height < 20) return;

            instance.data.createExistingRect(createCoord, das.labelColor, das.attributeName, dasID, dasLabelID);
        });
    }

    //adds the text label to the rectangle as a child
    instance.data.addLabel = function (rect) {
        const label = new PIXI.Text(rect.name, {
            fontFamily: instance.data.labelFont,
            fontSize: instance.data.labelFontSize,
            fill: "0x" + instance.data.labelFontColor,
            stroke: 0xffffff, // White border
            strokeThickness: 4, // Thickness of the border
            dropShadow: true,
            dropShadowColor: 0x000000, // Black drop shadow
            dropShadowAlpha: 0.8, // Adjust opacity as needed (0 transparent, 1 opaque)
            dropShadowDistance: 2, // Adjust the distance of the shadow from the text
            dropShadowBlur: 2, // Increase the blur for a more dispersed shadow
            wordWrap: true,
            wordWrapWidth: rect.width,
            breakWords: true,
        });
        rect.addChild(label);
        label.position.set(10, 10);

        let { width, height } = rect;
        let x = 0, y = 0;


        let labelX = 10;
        let labelY = 10;
        let labelWidth = label.width;
        let labelHeight = label.height;


        // if the recntangle is not highlighted, create the custom hit area that wraps around the rectangle and the label, else default to the visible area defined by pixis internals
        if (!rect.isHighlighted) {
            invisibleHitArea = new PIXI.Polygon([
                //starts wrapping around the outer rectangle
                new PIXI.Point(x - 5, y - 5), // top left corner of outer rectangle
                new PIXI.Point(x + width + 5, y - 5), // top right corner of outer rectangle
                new PIXI.Point(x + width + 5, y + height + 5), // bottom right corner of outer rectangle
                new PIXI.Point(x - 5, y + height + 5), // bottom left corner of outer rectangle
                new PIXI.Point(x - 5, y - 5), // top left corner of outer rectangle

                // //starts wrapping around the label
                new PIXI.Point(labelX, labelY), // top left corner of label
                new PIXI.Point(labelX + labelWidth, labelY), // top right corner of label
                new PIXI.Point(labelX + labelWidth, labelY + labelHeight), // bottom right corner of label
                new PIXI.Point(x + 10, labelY + labelHeight), // bottom of label, 5px inside of outer rectangle

                // //starts wrapping around the inner rectangle
                new PIXI.Point(x + 10, y + height - 10), // bottom left corner of inner rectangle
                new PIXI.Point(x + width - 10, y + height - 10), // bottom right corner of inner rectangle
                new PIXI.Point(x + width - 10, y + 10), // top right corner of inner rectangle
                new PIXI.Point(x + 10, y + 10), //top left of inner
            ])

            // create the graphics object for the hit area. this is not necessary, but it is helpful for debugging
            const hitAreaGraphics = new PIXI.Graphics();
            hitAreaGraphics.beginFill(0xFF0000, 0.0);
            hitAreaGraphics.drawPolygon(invisibleHitArea);
            hitAreaGraphics.endFill();

            // add the hit area to the rectangle
            rect.addChild(hitAreaGraphics);

            rect.hitArea = invisibleHitArea;
        }
        return label;
    };

    //creates a rectangle with a border, or a highlighted rectangle, if that is the label to be highlighted. This is the function that essentially created every rectangle
    instance.data.createExistingRect = function (createCoord, color, name, id, labelID) {
        //store the rectangle in a variable locally
        let rectCreated;

        if (color == null) {
            color = instance.data.highlightColor;
        }
        //create a standard rectangle if it is not the label to be highlighted
        if (labelID !== instance.data.proxyVariables.labelToHighlight) {
            rectCreated = instance.data.createBorderedRectangle(0, 0, createCoord.width - 1, createCoord.height - 1, color);
        }
        //create a highlighted rectangle if it is the label to be highlighted
        else if (labelID === instance.data.proxyVariables.labelToHighlight) {
            //subtract 1 to account for the border. Aka linestyle
            rectCreated = instance.data.createHighlightedRectangle(0, 0, createCoord.width - 1, createCoord.height - 1)

        }

        //setup custom properties to reference later
        rectCreated.labelColor = color;
        rectCreated.oldColor = color;
        rectCreated.name = name;
        rectCreated.id = id;
        rectCreated.labelUniqueID = labelID;
        rectCreated.intialScale = instance.data.app.view.width / instance.data.intialWebpageWidth;

        //then we move it to final position and add it to the main container
        rectCreated.position.copyFrom(
            new PIXI.Point(createCoord.startRectX, createCoord.startRectY)
        );
        instance.data.mainContainer.addChild(rectCreated);
        if (instance.data.displayLabelText) {
            let labelText = instance.data.addLabel(rectCreated);
        }
        instance.data.rectangles.push(rectCreated);
        rectCreated.interactive = true;

        //add event listeners to the rectangle
        rectCreated.addEventListener("pointermove", event => {


            const x = event.global.x - instance.data.mainContainer.x;
            const y = event.global.y - instance.data.mainContainer.y;
            let rectScaledWidth = rectCreated.width
            let rectScaledHeight = rectCreated.height
            let rectScaledX = rectCreated.x
            let rectScaledY = rectCreated.y
            const isInBottomRightCorner =
                x >= rectScaledX + rectScaledWidth - 20 &&
                y >= rectScaledY + rectScaledHeight - 20;

            if (!rectCreated.isHighlighted && !instance.data.proxyVariables.rectangleBeingResized && !instance.data.proxyVariables.rectangleBeingMoved && !instance.data.readOnly) {
                if (instance.data.proxyVariables.inputMode != instance.data.InputModeEnum.select) {
                    instance.data.inputMode = instance.data.InputModeEnum.select;
                    instance.data.proxyVariables.inputMode = instance.data.InputModeEnum.select;
                    rectCreated.cursor = "pointer";
                }
            }

            if (rectCreated.isHighlighted && !isInBottomRightCorner && !instance.data.readOnly) {
                if (instance.data.proxyVariables.inputMode != instance.data.InputModeEnum.move) {
                    instance.data.inputMode = instance.data.InputModeEnum.move;
                    instance.data.proxyVariables.inputMode = instance.data.InputModeEnum.move;
                    rectCreated.cursor = "move";
                }
            }
            if (rectCreated.isHighlighted && isInBottomRightCorner && !instance.data.readOnly) {
                if (instance.data.proxyVariables.inputMode != instance.data.InputModeEnum.scale) {
                    instance.data.inputMode = instance.data.InputModeEnum.scale;
                    instance.data.proxyVariables.inputMode = instance.data.InputModeEnum.scale;
                    rectCreated.cursor = "nwse-resize";
                }


            }
        }, { passive: true });
        rectCreated.addEventListener("pointerdown", e => {
            e.stopPropagation();
            console.log('rect pointerdown', rectCreated, !rectCreated.isSelected, e.data.button);
            if (e.data.button === 0) {
                const x = e.global.x - instance.data.mainContainer.x;
                const y = e.global.y - instance.data.mainContainer.y;
                let rectScaledWidth = rectCreated.width
                let rectScaledHeight = rectCreated.height
                let rectScaledX = rectCreated.x
                let rectScaledY = rectCreated.y
                const isInBottomRightCorner =
                    x >= rectScaledX + rectScaledWidth - 20 &&
                    y >= rectScaledY + rectScaledHeight - 20;

                console.log('rect selected CSP', !rectCreated.isSelected);
                if (!rectCreated.isSelected) {
                    instance.data.proxyVariables.selectedRectangle = rectCreated;
                    instance.data.selectedRectangle = rectCreated;
                    console.log('rect selected insde', instance.data.selectedRectangle);
                }



                //trigger the move start if the rectangle is highlighted
                if (rectCreated.isHighlighted && !isInBottomRightCorner && !instance.data.readOnly) {

                    if (instance.data.proxyVariables.inputMode !== instance.data.InputModeEnum.move) {
                        instance.data.inputMode = instance.data.InputModeEnum.move;
                        instance.data.proxyVariables.inputMode = instance.data.InputModeEnum.move;
                        rectCreated.cursor = "move";
                    }
                    instance.data.proxyVariables.rectangleBeingMoved = rectCreated;

                    //get the start position of the rectangle
                    startPosition = e.target.position;


                    //store the mouse position relative to the rectangle click position
                    //this is so that the rectangle will move with the mouse, and not jump to the mouse position
                    //clicked in the world at 500 subtractr the start position of the rectangle at 100 -- we clicked 400 px in the rectangle
                    rectCreated.relativeMouseX =
                        e.data.global.x - startPosition.x - instance.data.mainContainer.x;
                    rectCreated.relativeMouseY =
                        e.data.global.y - startPosition.y - instance.data.mainContainer.y;
                    //store the original position of the rectangle so we know if we need to push an update to the server
                    rectCreated.originalMovePositionX = rectCreated.position.x;
                    rectCreated.originalMovePositionY = rectCreated.position.y;
                    rectCreated.isMoving = true;

                }


                //trigger the resize start if the rectangle is highlighted and in the bottom right corner
                if (rectCreated.isHighlighted && isInBottomRightCorner && !instance.data.readOnly) {
                    startPosition = e.target.position;


                    if (instance.data.proxyVariables.inputMode !== instance.data.InputModeEnum.resize) {
                        instance.data.inputMode = instance.data.InputModeEnum.resize;
                        instance.data.proxyVariables.inputMode = instance.data.InputModeEnum.resize;
                        rectCreated.cursor = "nwse-resize";
                    }
                    instance.data.proxyVariables.rectangleBeingResized = rectCreated;

                    //get the start width and height of the rectangle
                    let startWidth = rectCreated.width;
                    let startHeight = rectCreated.height;

                    //store the mouse position relative to the rectangle resize position
                    //this is so that the rectangle will resize with the mouse, and not jump to the mouse position
                    //clicked in the world at 500 subtractr the start position of the rectangle at 100 -- we clicked 400 px in the rectangle
                    rectCreated.relativeMouseX =
                        e.data.global.x - (startPosition.x + startWidth) - instance.data.mainContainer.x;
                    rectCreated.relativeMouseY =
                        e.data.global.y - (startPosition.y + startHeight) - instance.data.mainContainer.y;

                    //store the original size of the rectangle so we know if we need to push an update to the server
                    rectCreated.originalResizeWidth = startWidth;
                    rectCreated.originalResizeHeight = startHeight;
                    rectCreated.startMouseX = e.data.global.x - instance.data.mainContainer.x;
                    rectCreated.startMouseY = e.data.global.y - instance.data.mainContainer.y;

                    rectCreated.isResizing = true;
                    instance.data.proxyVariables.rectangleBeingResized = rectCreated;





                }
            }
        }, { passive: true });
        rectCreated.addEventListener("pointerup", e => {
            e.stopPropagation();
            let drawnScale = instance.data.app.view.width / instance.data.intialWebpageWidth;

            if (instance.data.proxyVariables.rectangleBeingMoved && !instance.data.readOnly) {



                // Store the rectangle being moved in a variable
                let rectbeingMoved = instance.data.proxyVariables.rectangleBeingMoved;
                // Store the rect's current x and y position in variables
                let rectX = rectbeingMoved.x;
                let rectY = rectbeingMoved.y;



                //check if the rectangle has moved
                if (rectbeingMoved.originalMovePositionX != rectX || rectbeingMoved.originalMovePositionY != rectY) {
                    let borderWidth = rectbeingMoved.lineWidth;


                    //if it has, update the rectangle's position in the database
                    instance.data.updateDrawnLabel(instance.data.proxyVariables.rectangleBeingMoved.x, instance.data.proxyVariables.rectangleBeingMoved.y, instance.data.proxyVariables.rectangleBeingMoved.width, instance.data.proxyVariables.rectangleBeingMoved.height, drawnScale, instance.data.proxyVariables.rectangleBeingMoved.id)



                }

                instance.data.rectangleBeingMoved = null;
                instance.data.proxyVariables.rectangleBeingMoved = null;
            }

            if (instance.data.proxyVariables.rectangleBeingResized && !instance.data.readOnly) {


                instance.data.updateDrawnLabel(instance.data.proxyVariables.rectangleBeingResized.x, instance.data.proxyVariables.rectangleBeingResized.y, instance.data.proxyVariables.rectangleBeingResized.width, instance.data.proxyVariables.rectangleBeingResized.height, drawnScale, instance.data.proxyVariables.rectangleBeingResized.id)
            }
            instance.data.proxyVariables.rectangleBeingMoved = null;
            instance.data.rectangleBeingResized = null;
            instance.data.proxyVariables.rectangleBeingResized = null;
        }, { passive: true });



    };

    //not 100% sure this is useful anymore. possibly remove
    instance.data.onRectangleOver = function (e) {
        e.stopPropagation();
        e.bubbles = false;
        this.isOver = true;
        instance.data.inputMode = instance.data.InputModeEnum.select;
        instance.data.proxyVariables.inputMode = instance.data.InputModeEnum.select;
        // set current hovered rect to be on the top

    };

    // Normalize start and size of square so we always have top left corner as start and size is always +
    instance.data.getStartAndSize = function (pointA, pointB, type) {
        let deltaX = pointB.x - pointA.x;
        let deltaY = pointB.y - pointA.y;
        let absDeltaX = Math.abs(deltaX);
        let absDeltaY = Math.abs(deltaY);
        let startX = deltaX > 0 ? pointA.x : pointB.x;
        let startY = deltaY > 0 ? pointA.y : pointB.y;

        //when the rectangle gets scaled, I need to factor that into the size of the rectangle
        //When the page gets bigger, I need the rectangle to get drawn smaller,
        //so I need to factor in the scale of the rectangle
        //i know the rectangles scale ratio. I can get it with currentRectangle.scale

        if (type == "scaleRect") {
            let currentScaleRatio = instance.data.currentRectangle.scale.x;
            let scaleRatio = 1 / currentScaleRatio;
            return {
                start: new PIXI.Point(startX, startY),
                size: new PIXI.Point(absDeltaX * scaleRatio, absDeltaY * scaleRatio),
            };
        } else if (type == "draw") {
            return {
                start: new PIXI.Point(
                    startX - instance.data.mainContainer.position.x,
                    startY - instance.data.mainContainer.position.y
                ),
                size: new PIXI.Point(absDeltaX, absDeltaY),
            };
        }
    };

    //this is triggered during the creation of a new rectangle. It's triggered after the intial rect was created
    instance.data.resizeNewRectangle = function (resizeRectange, currentPosition) {
        let { start, size } = instance.data.getStartAndSize(instance.data.startPosition, currentPosition, "draw");
        if (size.x < 5 || size.y < 5) return;

        // When we scale rect we have to give it new cordinates
        resizeRectange.clear();
        resizeRectange.position.copyFrom(start);
        resizeRectange
            .beginFill("0x" + instance.data.resizeColor, 0.5)
            .lineStyle({
                color: "0x" + instance.data.resizeColor,
                alpha: 0.5,
                width: 1,
            })
            .drawRect(0, 0, size.x, size.y)
            .endFill();
        instance.data.mainContainer.addChild(resizeRectange);
    };

    //triggers the selection of a rectangle. Probably not necessary anymore because of the proxy variables
    instance.data.selectRect = function (rectangle) {
        instance.data.proxyVariables.selectedRectangle = rectangle;
    };

    //this generates our standard rectangle style. It's used when we create a new rectangle. Simply returns the graphic object that can be used elsewhere
    instance.data.createBorderedRectangle = function (
        x,
        y,
        width,
        height,
        color
    ) {

        // create a polygon that will be used as the hit area for the rectangle this just draws a shape around the borders of the rectangle
        // 

        let rectangle = new PIXI.Graphics()
            .beginFill("0x" + color, instance.data.normalColorAlpha)
            .drawRect(x, y, width, height)
            .endFill()
            .beginHole()
            .drawRect(5, 5, width - 10, height - 10)
            .endHole();

        return rectangle;
    };

    // This generates our highlighted rectangle style.
    instance.data.createHighlightedRectangle = function (x, y, width, height) {
        let rectangle = new PIXI.Graphics()
            .beginFill("0x" + instance.data.highlightColor, instance.data.highlightColorAlpha)
            .lineStyle(1, 0x000000, 1)
            .drawRect(x, y, width, height)
            .endFill();

        rectangle.isHighlighted = true;

        return rectangle;
    }

    // this function runs a fetch API call to our API to update the drawn label
    //simply run this to update the drawn label in Bubble. We just need to pass it the details of the shape and it will update what is necessary.
    instance.data.updateDrawnLabel = function (x, y, width, height, initial_drawn_scale, drawn_label_snippet) {
        // Set the headers list
        let headersList = {
            "Accept": "*/*",
        };
        // Create a form data object
        let bodyContent = new FormData();
        // Append the parameters to the form
        bodyContent.append("x", x);
        bodyContent.append("y", y);
        bodyContent.append("width", width);
        bodyContent.append("height", height);
        bodyContent.append("initial_drawn_scale", initial_drawn_scale)
        bodyContent.append("drawn_label_snippet", drawn_label_snippet);

        // Fetch the data from the API endpoint using POST method
        fetch(`https://app.syllabus.io/${instance.data.dynamicFetchParam}api/1.1/wf/update-drawn-label`, {
            method: "POST",
            body: bodyContent,
            headers: headersList
        }).then(response => response.json())
            .then(result => {
                //return nothing here for now. Maybe used for local rendering instead in the future, if the update function runs too slow
                return result
            })
            .catch(error => {
                ;
                throw error
            }
            );
    }
    
    instance.data.visibleObserver = new IntersectionObserver(async (entries, observer) => {
      try {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            console.log('creating');
            instance.data.app = new PIXI.Application({
              resizeTo: instance.canvas,
              backgroundColor: 0x000000,
              backgroundAlpha: 0,
            });
            instance.data.start = true;

            // Generate a random number and publish it as a state
            const randomNumber = Math.random();
            instance.publishState('reset', randomNumber);
            instance.data.visible = true;
            instance.publishState('visible', true);
            instance.data.mainElementObserver.observe(instance.canvas);
          } else {
            // Call your destroy function and clean up resources
            if (instance.data.app && instance.data.app.renderer) {
                console.log('destroying');
              instance.data.app.renderer.destroy(true);
              // Clean up any other resources associated with the PIXI Application here
              instance.data.app = null; // Reset the app reference
              instance.data.mainElementObserver.unobserve(instance.canvas);
              instance.data.visible = false;
              instance.publishState('visible', false);
            }
          }
        });
      } catch (error) {
        console.error('An error occurred:', error);
      }
    });

    // Start observing the target element
    instance.data.visibleObserver.observe(instance.canvas);

// Initialize the ResizeObserver to handle element resizes
instance.data.mainElementObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    if (instance.data.resizeScroll) {
      // Smooth out the resize scroll value by averaging it with the previous scroll position
      instance.data.resizeScroll = (instance.data.scrollPositionBefore + instance.data.resizeScroll * 9) / 10;
    } else {
      instance.data.resizeScroll = instance.data.scrollPositionBefore;
    }

    // Trigger the PIXI app to resize (if it exists)
    if (instance.data.app && instance.data.app.renderer) {
      instance.data.app.resize();
    }

    // Calculate the new position based on the scroll and adjust the container's y position
    let newPosition = Math.abs(instance.data.resizeScroll) * (instance.data.mainContainer.height - (instance.data.app ? instance.data.app.view.height : 0));
    instance.data.mainContainer.position.y = -newPosition;
  }
});

// Observe the target element for resizing
instance.data.mainElementObserver.observe(instance.canvas);

}