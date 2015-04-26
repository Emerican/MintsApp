module.exports = function (grunt) {

  grunt.loadNpmTasks('assemble');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.initConfig(
  {
    watch: {
      assemble: {
        files: ['templates/layout/layout.hbs','templates/partials/*.hbs','templates/partials/**/*.hbs'],
        tasks: ['assemble'],
        options: {
          spawn: false,
        },
      },
    },
    assemble: {
      options: {
        layout: ['templates/layout/layout.hbs'],
        partials: ['templates/partials/*.hbs','templates/partials/**/*.hbs']
      },
      site: {
        src: ['index.hbs'],
        dest: './www/'
      }
    },
  });

};
