function(instance, properties, context) {
    //find the instances of DAS in this PIXI instance
    const findDAS = instance.data.rectangles.filter(item => item.id === properties.das);
    //Set infinity
    const inf = 1 / 0;
    let newPosition = 0;
    //find the first item that has a y value
    for (let i = 0; i < findDAS.length; i++) {
        if (findDAS[i].y !== inf && findDAS[i].y !== null && typeof findDAS[i].y !== "undefined") {
            newPosition = (findDAS[i].y + properties.ypadding) * -1;
            break;
        }
    }
    //if there is an item, scroll to it
    if (newPosition !== 0) {
        properties.logging ? console.log("findDas", findDAS, newPosition) : null;
        instance.data.mainContainer.position.y = newPosition;
    } else {
        properties.logging ? console.log("findDas Y empty") : null;
    }
    //debugging
    properties.logging ? window.PCS = instance : null;
}
