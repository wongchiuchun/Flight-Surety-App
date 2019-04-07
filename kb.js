let list = [1,3,6,7,3235,5];

function test (x){
    list.push(x);
};

function newt (y){
    if (y in list){
        console.log('yes');
    } else {
        test(y)
    }
}

newt(1);
newt(8);

console.log(list)
