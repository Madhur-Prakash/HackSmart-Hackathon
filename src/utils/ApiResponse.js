class ApiResponse {
    constructor(status_code, data, message = "Success"){
        this.status_code = status_code
        this.message = message
        this.data = data
        this.success = status_code<400 
    }}

export {ApiResponse}