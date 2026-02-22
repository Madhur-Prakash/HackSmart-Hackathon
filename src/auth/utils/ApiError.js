class ApiError extends Error {
    constructor(status_code, message= "Something went wrong", errors = [], error_stack = ""){
        super(message)
        this.status_code = status_code
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors
        
        if(error_stack){
            this.error_stack = error_stack
        } else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError}