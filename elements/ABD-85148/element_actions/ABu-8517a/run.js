function(instance, properties, context) {


  //Load any data 
const findDAS = instance.data.rectangles.filter(item => item.id === properties.das);
let newPosition = (findDAS[0].y + properties.ypadding) * -1;
console.log("findDas",findDAS, newPosition);
instance.data.mainContainer.position.y = newPosition;

  //Do the operation



}