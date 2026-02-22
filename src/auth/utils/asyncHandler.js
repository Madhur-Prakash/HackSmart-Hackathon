// as asyncHandler is a higher-order function that takes a function `fn` and returns a new function that handles errors by passing them to the next middleware in an Express application, therefore, it is defined as an arrow function that further takes a another arrow function that returns an async function.

const asyncHandler = ((func) => {
    return (req, res, next) => {
        Promise.resolve(func(req, res, next)).catch((error) => next(error))
    }
})

export {asyncHandler} 

// v2 using try-catch
// const asyncHandler = ( (func) => async (req, res, next) => {
//     try {
//         await func(req, res, next)
//     } catch (error) {
//            res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//            })        
//     }
// }) 

