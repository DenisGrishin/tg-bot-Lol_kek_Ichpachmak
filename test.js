const obj = {
  user: {
    name: 'John Doe',
    age: null,
    info: {
      address: '123 Main St',
      phone: '123-456-7890',
      hobbies: null,
    },
    someInfo: {
      1: null,
      2: 'value2',
    },
  },
};

//TODO: Напиши функцию findNullPaths(obj), которая принимает объект и возвращает массив строк, представляющих пути к свойствам со значением null.
//   ('user.age', 'user.info.hobbies', 'user.someInfo.1')
const findNullPaths = (obj) => {};
findNullPaths(obj);

//-------------------------------------------
// function carry(fn) {
//   return function carried(...args) {
//     if (args.length >= fn.length) {
//       return fn.apply(this, args);
//     } else {
//       return function (...args1) {
//         return carried.apply(this, [...args, ...args1]);
//       };
//     }
//   };
// }
// function sum(a, b, c) {
//   return a + b + c;
// }

// let curriedSum = carry(sum);

// console.log(curriedSum(1, 2)(3));
