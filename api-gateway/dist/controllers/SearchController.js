"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchController = void 0;
class SearchController {
    searchService;
    constructor(searchService) {
        this.searchService = searchService;
    }
    query = async (req, res) => {
        const q = String(req.query.q ?? '');
        const result = await this.searchService.search(q);
        res.status(200).json(result);
    };
}
exports.SearchController = SearchController;
