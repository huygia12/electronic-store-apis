const isValidDate = (dateString: string): boolean => {
    try {
        const date = new Date(dateString);
        return !isNaN(date.getDate());
    } catch {
        return false;
    }
};

export default isValidDate;
