const {asyncIter2Array} = require("../kit/utils/async");
const {Notion} = require("../kit/foundations/notion");

module.exports = {
    operation: {
        perform: async (z, bundle) => {
            const notion = new Notion(
                {
                    accessToken: bundle.authData.access_token
                }
            )

            return (
                await asyncIter2Array(
                    await notion.databases()
                )
            ).map(
                ({
                     id,
                     title: [
                         {
                             text: {content},
                         },
                     ],
                 }) => ({
                    id: id,
                    title: content,
                })
            )

        },
        sample: {id: 'e635b399-e657-4625-be0e-af819a8907d6', title: 'الخطط'},
        outputFields: [{key: 'id'}, {key: 'title'}],
    },
    display: {
        description: 'Triggers when a new database is created.',
        hidden: true,
        label: 'List databases',
    },
    key: 'list_databases',
    noun: 'Database',
};
