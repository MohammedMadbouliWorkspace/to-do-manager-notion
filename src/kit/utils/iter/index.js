// const diff = (a, b) => [
//     a.filter((item) => !b.includes(item)),
//     b.filter((item) => !a.includes(item)),
// ];
const _ = require("lodash");
const diff = (oldArray, newArray) => [
    _.differenceWith(oldArray, newArray, _.isEqual),
    _.intersectionWith(oldArray, newArray, _.isEqual),
    _.differenceWith(newArray, oldArray, _.isEqual)
]

const tandemIter = function* (arr) {
    let previousItem;
    for (const currentItem of arr) {
        yield [previousItem, currentItem];
        previousItem = currentItem;
    }
}

const uniquify = (arr, iteratee='id') => _(arr).groupBy(iteratee)
    .map((group) => _.last(group))
    .value()

const modify = (obj, updates) => {
    for (const [path, value] of updates) {
        _.set(obj, path, value);
    }
    return obj;
};

const merge = (obj1, obj2) => {
    return _.mergeWith(
        obj1,
        obj2,
        (objValue, srcValue) => {
            if (_.isArray(objValue)) {
                const [,r,n] = diff(objValue, srcValue)
                return r.concat(n);
            }
        }
    )
}

const clean = (obj, {preserveNull = true, preserveEmpty = true}={}) => {
    if (_.isObject(obj) && !_.isArray(obj)) {
        const cleanedObject = _.pickBy(
            obj,
            (value) => {
                if (preserveNull) {
                    return !_.isUndefined(value)
                }
                return !(_.isUndefined(value) || _.isNull(value))
            }
        )

        for (const key in cleanedObject) {
            const cleanedValue = clean(cleanedObject[key], {preserveNull, preserveEmpty})
            cleanedObject[key] = cleanedValue

            if (_.isObject(cleanedValue) && _.isEmpty(cleanedValue) && !preserveEmpty) {
                delete cleanedObject[key];
            }
        }

        return cleanedObject

    } else if (_.isArray(obj)) {

        return _.compact(
            _.map(obj, (obj) => clean(obj, {preserveNull, preserveEmpty}))
        ).filter(
            (a) =>
                _.isObject(a) && !preserveEmpty ?
                    !_.isEmpty(a) : a
        )

    } else {
        return obj
    }
}

exports.diff = diff
exports.clean = clean
exports.dynamic = clean
exports.modify = modify
exports.merge = merge
exports.tandemIter = tandemIter
exports.uniquify = uniquify