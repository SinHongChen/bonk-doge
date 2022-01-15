const self = module.exports = {
    sleep: (second) => {
        return new Promise((resolve) => setTimeout(resolve, second * 1000))
    },
    setIntervalAsync: (callback, second) => {
        Promise.resolve(callback())
            .then(() => self.sleep(second))
            .then(() => self.setIntervalAsync(callback, second))
    }
}