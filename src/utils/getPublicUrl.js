const { supabase } = require('../utils/initSupabase');

exports.getUrl = async (bucketName, folderFileName) => {
    try {
        const { publicURL, error } = await supabase
            .storage
            .from(`${bucketName}`)
            .getPublicUrl(`${folderFileName}`)

        return publicURL;
    } catch (error) {
        return error
    }
};