/*!
 * Macaque
 * Copyright (c) David Bushell | @dbushell | http://dbushell.com/
 */

// create test data

var generateTasks = function(text)
{
    var i, tasks = [];
    for (i = 0; i < 100; i++)
    {
        tasks.push({
            'id': i + 1,
            'text': text[i],
            'created': new Date(new Date().getTime() + i * 10000000),
            'done': false
        });
    }
    return tasks;
};

var text = [
    'Phasellus fermentum convallis',
    'aliquet, sem ut cursus luctus, ipsum leo elementum sem, vitae aliquam eros turpis non enim. Mauris',
    'magna a neque. Nullam ut nisi a odio semper cursus. Integer mollis. Integer tincidunt aliquam arcu. Aliquam ultrices iaculis odio.',
    'Donec porttitor tellus non magna. Nam ligula elit, pretium et, rutrum non, hendrerit id, ante. Nunc mauris sapien, cursus in,',
    'imperdiet non, vestibulum nec, euismod',
    'Cum sociis natoque penatibus et magnis dis parturient montes,',
    'consectetuer adipiscing elit. Aliquam',
    'odio a purus. Duis elementum, dui quis accumsan convallis, ante lectus',
    'dolor. Fusce feugiat. Lorem ipsum dolor',
    'fringilla cursus purus. Nullam scelerisque neque sed sem egestas blandit. Nam nulla magna, malesuada vel, convallis',
    'congue turpis. In condimentum. Donec at arcu. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae;',
    'eu tellus eu augue porttitor interdum. Sed auctor odio a purus.',
    'et, rutrum eu, ultrices sit amet, risus. Donec nibh enim, gravida sit amet, dapibus id, blandit',
    'est arcu ac orci. Ut semper pretium neque. Morbi quis urna. Nunc quis arcu vel quam',
    'convallis erat, eget tincidunt dui augue eu tellus. Phasellus elit pede, malesuada vel, venenatis vel, faucibus',
    'magna. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Etiam laoreet, libero et tristique pellentesque, tellus sem mollis',
    'penatibus et magnis dis parturient montes, nascetur ridiculus mus. Aenean',
    'quis, tristique ac, eleifend vitae, erat. Vivamus nisi. Mauris nulla. Integer urna. Vivamus molestie dapibus ligula. Aliquam erat volutpat.',
    'id enim. Curabitur massa. Vestibulum accumsan neque et nunc. Quisque ornare tortor at risus. Nunc',
    'egestas blandit. Nam nulla magna, malesuada vel, convallis in, cursus et, eros. Proin ultrices. Duis volutpat nunc sit amet metus.',
    'Mauris molestie pharetra nibh. Aliquam ornare, libero at auctor ullamcorper, nisl arcu iaculis enim, sit amet ornare lectus justo',
    'risus odio, auctor vitae, aliquet nec, imperdiet nec, leo. Morbi neque tellus,',
    'Duis risus odio, auctor vitae, aliquet nec, imperdiet',
    'tellus. Suspendisse sed dolor. Fusce mi lorem, vehicula et, rutrum',
    'elit, dictum eu, eleifend nec, malesuada ut, sem. Nulla interdum. Curabitur dictum. Phasellus in felis. Nulla tempor augue ac ipsum.',
    'gravida. Aliquam tincidunt, nunc ac mattis ornare, lectus ante',
    'erat nonummy ultricies ornare, elit elit fermentum risus, at fringilla purus mauris a nunc. In at pede. Cras vulputate',
    'Donec tempus, lorem fringilla ornare placerat, orci lacus vestibulum',
    'feugiat metus sit amet ante. Vivamus non lorem',
    'nec orci. Donec nibh. Quisque nonummy ipsum non arcu.',
    'lobortis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos hymenaeos. Mauris ut',
    'Suspendisse aliquet, sem ut cursus luctus, ipsum leo elementum sem, vitae aliquam eros turpis non enim. Mauris quis',
    'ultricies ornare, elit elit fermentum risus, at fringilla purus mauris a nunc. In at pede. Cras vulputate velit eu',
    'elit pede, malesuada vel, venenatis vel, faucibus id, libero. Donec consectetuer mauris',
    'ante lectus convallis est, vitae sodales nisi magna sed dui. Fusce aliquam, enim nec tempus scelerisque,',
    'malesuada vel, venenatis vel, faucibus id, libero. Donec consectetuer mauris id',
    'lacus. Quisque purus sapien, gravida non, sollicitudin a, malesuada id, erat. Etiam vestibulum massa rutrum magna.',
    'semper rutrum. Fusce dolor quam, elementum at, egestas a, scelerisque sed, sapien. Nunc',
    'pede. Nunc sed orci lobortis augue scelerisque mollis. Phasellus libero mauris, aliquam eu, accumsan sed, facilisis vitae, orci. Phasellus dapibus',
    'ac, feugiat non, lobortis quis, pede. Suspendisse dui. Fusce diam nunc, ullamcorper',
    'Curabitur consequat, lectus sit amet luctus vulputate,',
    'mollis nec, cursus a, enim. Suspendisse aliquet, sem ut cursus luctus, ipsum leo elementum sem, vitae aliquam eros',
    'risus quis diam luctus lobortis. Class aptent taciti sociosqu ad litora torquent per conubia nostra,',
    'quam, elementum at, egestas a, scelerisque sed, sapien. Nunc pulvinar arcu et pede. Nunc sed orci lobortis',
    'Nulla interdum. Curabitur dictum. Phasellus in felis. Nulla tempor',
    'tempor diam dictum sapien. Aenean',
    'nec urna et arcu imperdiet ullamcorper. Duis at lacus. Quisque purus',
    'urna. Nullam lobortis quam a felis ullamcorper viverra.',
    'libero et tristique pellentesque, tellus sem mollis dui, in sodales elit erat vitae risus. Duis a mi',
    'Proin sed turpis nec mauris blandit mattis. Cras eget nisi dictum augue malesuada malesuada. Integer id magna et ipsum cursus',
    'Aenean egestas hendrerit neque. In ornare sagittis',
    'non, sollicitudin a, malesuada id, erat.',
    'sem mollis dui, in sodales elit erat vitae risus. Duis a mi',
    'est ac mattis',
    'et, magna. Praesent interdum ligula eu enim. Etiam imperdiet dictum magna. Ut tincidunt orci quis lectus. Nullam suscipit,',
    'nisi a odio semper cursus. Integer mollis. Integer tincidunt aliquam arcu.',
    'nunc sed pede. Cum sociis natoque penatibus et magnis dis parturient',
    'mauris eu elit. Nulla facilisi. Sed',
    'Quisque tincidunt pede ac urna. Ut tincidunt vehicula risus. Nulla eget metus eu',
    'pharetra sed, hendrerit a, arcu. Sed et',
    'dignissim. Maecenas ornare egestas ligula. Nullam',
    'blandit viverra. Donec tempus,',
    'ligula. Aliquam erat volutpat. Nulla dignissim. Maecenas ornare egestas ligula.',
    'Sed neque. Sed',
    'aliquam adipiscing lacus. Ut nec urna',
    'nunc risus varius orci, in consequat enim diam vel arcu. Curabitur ut odio vel est tempor',
    'Fusce diam nunc, ullamcorper eu, euismod ac, fermentum vel, mauris. Integer',
    'sit amet, consectetuer adipiscing elit. Aliquam auctor, velit eget laoreet posuere,',
    'et, rutrum eu, ultrices sit amet, risus. Donec nibh enim, gravida sit amet, dapibus id, blandit',
    'quis lectus. Nullam suscipit, est ac facilisis facilisis, magna tellus faucibus',
    'mattis velit justo nec',
    'dictum magna. Ut tincidunt orci quis lectus. Nullam suscipit, est ac facilisis facilisis, magna tellus',
    'Quisque libero lacus, varius et, euismod et,',
    'elit, a feugiat tellus lorem eu metus. In lorem. Donec elementum, lorem ut aliquam iaculis, lacus pede',
    'quis diam. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Fusce aliquet magna a',
    'diam dictum sapien. Aenean massa. Integer vitae nibh. Donec est mauris, rhoncus id, mollis nec, cursus a,',
    'accumsan laoreet ipsum. Curabitur consequat, lectus sit amet luctus vulputate,',
    'egestas. Sed pharetra, felis eget varius ultrices, mauris ipsum porta elit, a feugiat tellus lorem eu metus.',
    'nunc. In at pede. Cras vulputate velit eu',
    'interdum. Sed auctor',
    'fermentum risus, at fringilla purus mauris a nunc. In at pede. Cras vulputate velit eu sem. Pellentesque',
    'mi enim, condimentum eget, volutpat ornare, facilisis eget, ipsum. Donec sollicitudin adipiscing ligula. Aenean gravida nunc sed pede. Cum',
    'Nullam velit dui, semper et, lacinia vitae, sodales at, velit. Pellentesque ultricies dignissim lacus. Aliquam rutrum',
    'enim. Etiam gravida molestie arcu. Sed eu nibh',
    'Etiam laoreet, libero et tristique pellentesque, tellus sem mollis dui, in sodales elit erat vitae risus. Duis a',
    'nunc, ullamcorper eu, euismod ac,',
    'vitae risus. Duis a mi fringilla mi lacinia mattis. Integer eu lacus. Quisque imperdiet, erat nonummy',
    'auctor vitae, aliquet nec, imperdiet nec, leo. Morbi neque tellus, imperdiet non,',
    'ullamcorper viverra. Maecenas iaculis aliquet diam. Sed diam lorem, auctor quis, tristique ac, eleifend vitae,',
    'Proin non massa non ante bibendum ullamcorper. Duis cursus, diam at pretium aliquet, metus urna convallis erat,',
    'aliquet, metus urna convallis erat, eget tincidunt dui augue eu',
    'scelerisque neque sed sem egestas blandit. Nam nulla magna, malesuada vel, convallis in, cursus et, eros.',
    'dapibus rutrum, justo. Praesent luctus. Curabitur egestas nunc sed libero. Proin sed',
    'risus. Duis a mi fringilla mi lacinia mattis. Integer eu lacus. Quisque imperdiet, erat nonummy',
    'congue. In scelerisque scelerisque dui. Suspendisse ac metus vitae',
    'Curabitur dictum. Phasellus in felis. Nulla tempor',
    'cursus luctus, ipsum leo elementum sem, vitae aliquam eros turpis non enim. Mauris',
    'ridiculus mus. Proin vel arcu eu odio tristique pharetra. Quisque ac libero',
    'risus, at fringilla purus mauris a nunc. In at pede. Cras',
    'semper et, lacinia vitae, sodales at, velit. Pellentesque ultricies dignissim lacus. Aliquam rutrum lorem ac risus. Morbi metus.'
];

exports.tasksJSON = {
    'success': 1,
    'tasks': generateTasks(text)
};
