const {Client} = require("@notionhq/client");
const {asyncIterWithCallback} = require("../../utils/async");

class Page {
    constructor(id, _client) {
        this._id = id
        this._client = _client
    }

    edit = (args) => this._client.pages.update(
        {
            page_id: this._id,
            ...args
        }
    )
}

class Database {
    constructor(id, _client, _autoScrolling, _scrollingSize, _limit) {
        this._id = id
        this._client = _client
        this._autoScrolling = _autoScrolling
        this._scrollingSize = _scrollingSize
        this._limit = _limit
    }

    page = (id) => new Page(id, this._client)

    query = (query, {scrolling = this._autoScrolling, scrollingSize = this._scrollingSize, limit = this._limit} = {}) =>
        Notion._dependsOnScrollingSetting(
            this._client.databases.query,
            {
                database_id: this._id,
                ...query
            },
            {scrolling, scrollingSize, limit}
        )

    getPagesByIds = (name, ids, {scrolling = this._autoScrolling, scrollingSize = this._scrollingSize, limit = this._limit} = {}) =>
        ids?.length ? Notion._dependsOnScrollingSetting(
            this._client.databases.query,
            {
                database_id: this._id,
                filter: {
                    ...Database._convertToIdsFilter(name, ids)
                }
            },
            {scrolling, scrollingSize, limit}
        ) : asyncIterWithCallback([]);

    static _convertToIdsFilter = (name, ids) => (
        {
            or: ids.map(
                id => (
                    {
                        property: name,
                        "unique_id": {
                            equals: id
                        }
                    }
                )
            )
        }
    )
}

class Notion {
    constructor({accessToken, autoScrolling = true, scrollingSize = 100, limit = Infinity}) {
        this._client = new Client(
            {
                auth: accessToken,
                timeoutMs: Notion.MAX_TIMEOUT
            }
        )

        this._autoScrolling = autoScrolling
        this._scrollingSize = scrollingSize
        this._limit = limit
    }

    page = (id) => new Page(id, this._client)

    database = (id) => new Database(id, this._client, this._autoScrolling, this._scrollingSize, this._limit)

    databases = async ({scrolling = this._autoScrolling, scrollingSize = this._scrollingSize, limit = this._limit} = {}) =>
        Notion._dependsOnScrollingSetting(
            this._client.search,
            {
                filter: {
                    value: 'database',
                    property: 'object'
                }
            },
            {scrolling, scrollingSize, limit}
        )

    static MAX_TIMEOUT = 3600000

    static _dependsOnScrollingSetting = (method, args, {scrolling, scrollingSize, limit} = {}) =>
        scrolling ? Notion._scroll(method, scrollingSize, limit)(args) : method({
            ...args,
            page_size: scrollingSize
        })

    static _scroll = (method, size = 100, limit = Infinity, counter=0) => async function* (args) {
        const response = await method(
            {
                ...args,
                page_size: size
            }
        )

        const {results, next_cursor: nextCursor} = response

        for (const result of results) {
            if (counter === limit) {
                return;
            } else {
                yield result
                counter++
            }
        }

        if (nextCursor) {
            yield* await Notion._scroll(method, size, limit, counter)(
                {
                    ...args,
                    page_size: size,
                    start_cursor: nextCursor
                }
            )
        }
    }
}

exports.Notion = Notion;